import { Controller, Get, Inject } from '@nestjs/common';
import { AwsService } from 'src/aws/aws.service';
import { KeywordEdit } from 'src/interface/keyword';
import { KeywordService } from 'src/keyword/keyword.service';
import { NewsService } from 'src/news/news.service';
import { convertImgToWebp, getKRTime } from 'src/tools/common';

@Controller('migration')
export class MigrationController {
  private readonly url1: string = 'http://localhost:3001';
  private readonly url2: string = 'https://api.yvoting.com';

  constructor(
    @Inject(NewsService)
    private readonly newsService: NewsService,
    @Inject(KeywordService)
    private readonly keywordService: KeywordService,
    @Inject(AwsService)
    private readonly awsService: AwsService,
  ) {}

  @Get('/keyword')
  async keywordMigrate() {
    const response = await fetch(`${this.url2}/admin/keywords/keyword`);
    const body = await response.json();
    const keywords = body.result.keywords;
    for (const i in keywords) {
      const k = keywords[i];
      const response = await fetch(`${this.url2}/admin/keywords/${k.keyword}`);
      const j = await response.json();
      const { _id, keyword, explain, category } = j.result.keyword;
      let imgSrc: string | null = null;
      try {
        const imgRsp = await fetch(`${this.url2}/images/keyword/${_id}`);
        const img = await convertImgToWebp(
          Buffer.from(await (await imgRsp.blob()).arrayBuffer()),
        );
        imgSrc = await this.awsService.imageUploadToS3(
          keyword + '_org',
          img,
          'webp',
        );
      } catch (e) {
        console.log(e);
      }
      const newKeyword = {
        keyword,
        explain,
        category,
        keywordImage: imgSrc,
        news: [],
      } as KeywordEdit;

      const response2 = await this.keywordService.postKeyword(newKeyword);
      if (Number(i) % 10 == 9) {
        console.log(`=[${i}/${keywords.length}]==========================`);
        console.log(response2);
      }
    }
  }

  @Get('/news')
  async newsMigrate() {
    const getCommentTitle = (title: string) => {
      const dates = title.match(/\((\d{1,2})\/(\d{1,2})\)/);
      if (!dates) return title;
      const month = dates[1];
      const day = dates[2];
      const formatted = ` (${month}/${day})`;
      return title.split(formatted)[0];
    };

    const getCommentDate = (title: string) => {
      const dates = title.match(/\((\d{1,2})\/(\d{1,2})\)/);
      let year, month, date;
      if (dates) {
        year = '2024';
        month = dates[1];
        date = dates[2];
      } else {
        year = '2023';
        month = '01';
        date = '01';
      }

      const commentDate = getKRTime(year + '-' + month + '-' + date);
      return commentDate;
    };

    try {
      const response = await fetch(`${this.url2}/admin/news/title?search=`);
      const body = await response.json();
      const newsTitles = body.result.news as Array<{
        _id: string;
        title: string;
      }>;
      for (const i in newsTitles) {
        const newsTitle = newsTitles[i];
        const { _id, title } = newsTitle;
        const response = await fetch(`${this.url2}/admin/news/${_id}`);
        const body = await response.json();
        const {
          _id: _,
          opinions,
          timeline,
          comments,
          keywords,
          votes,
          ...rest
        } = body.result.news;

        const opinionLeft = opinions.left;
        const opinionRight = opinions.right;
        let imgSrc: string | null = null;
        try {
          const imgRsp = await fetch(`${this.url2}/images/news/${_id}`);
          const img = await convertImgToWebp(
            Buffer.from(await (await imgRsp.blob()).arrayBuffer()),
          );
          imgSrc = await this.awsService.imageUploadToS3(
            'news' + i + '_org',
            img,
            'webp',
          );
        } catch (e) {
          console.log(e);
        }

        const newComments = Object.keys(comments ?? {}).reduce((acc, k) => {
          const cArr = comments[k];

          const newC = cArr.map((comment, idx) => {
            const newComment = {
              order: idx,
              title: getCommentTitle(comment.title),
              commentType: k,
              comment: comment.comment,
              date: getCommentDate(comment.title),
            };
            return newComment;
          });
          return [...acc, ...newC];
        }, []);

        const newTimeline = (timeline ?? []).map((t) => {
          const { _id, date, title } = t;
          return { date: getKRTime(date), title: title };
        });

        const newKeywords = (
          await Promise.all(
            keywords.map(async (k) => {
              const keyword = await this.keywordService.getKeywordByKey(k);
              if (!keyword) return null;
              return { id: keyword?.id };
            }),
          )
        ).filter((s) => s != null);

        const newsMy = {
          title,
          opinionLeft,
          opinionRight,
          comments: newComments,
          timeline: newTimeline,
          keywords: newKeywords,
          newsImage: imgSrc,
          ...rest,
        };
        const response2 = await this.newsService.postNews(newsMy);

        if (Number(i) % 10 == 9) {
          console.log(
            `=${i}/${newsTitles.length}==================================`,
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
}
