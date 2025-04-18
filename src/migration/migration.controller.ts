import { Controller, Get, Inject } from '@nestjs/common';
import { AwsService } from 'src/aws/aws.service';
import { INF } from 'src/interface/common';
import { KeywordEdit } from 'src/interface/keyword';
import { KeywordService } from 'src/keyword/keyword.service';
import { NewsService } from 'src/news/news.service';
import { convertImgToWebp, getKRTime } from 'src/tools/common';

@Controller('migration')
export class MigrationController {
  private readonly url1: string = 'http://localhost:3001';
  private readonly url2: string = 'https://api.yvoting.com';
  private readonly url3: string = 'http://13.211.177.184:3001';

  constructor(
    @Inject(NewsService)
    private readonly newsService: NewsService,
    @Inject(KeywordService)
    private readonly keywordService: KeywordService,
    @Inject(AwsService)
    private readonly awsService: AwsService,
  ) {}

  get url() {
    return this.url2;
  }

  @Get('/v2/keyword')
  async keywordMigV2() {
    const keylist = await this.keywordService.getKeywordsKeyList(0, INF, '');

    for (const key of keylist) {
      const keyword = await this.keywordService.getKeywordByKey(key.keyword);
      const response = await fetch(`${this.url}/keyword/edit`, {
        method: 'POST', // POST 메서드 설정

        body: JSON.stringify({ keyword: keyword }),
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  @Get('/v2/news')
  async newsMigV2() {
    const idlist = await this.newsService.getNewsIds();

    for (const id of idlist) {
      const news = await this.newsService.getNewsToEditById(id.id);
      const response = await fetch(`${this.url}/news/edit`, {
        method: 'POST', // POST 메서드 설정

        body: JSON.stringify({ news: news }),
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  @Get('/keyword')
  async keywordMigrate() {
    const response = await fetch(`${this.url}/admin/keywords/keyword`);

    const body = await response.json();
    const keywords = body.result.keywords;
    for (const i in keywords) {
      const k = keywords[i];

      const response = await fetch(`${this.url}/admin/keywords/${k.keyword}`);

      const j = await response.json();
      const { _id, keyword, explain, category } = j.result.keyword;
      let imgSrc: string | null = null;
      try {
        const imgRsp = await fetch(`${this.url}/images/keyword/${_id}`);

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

      if (dates) {
        const month = dates[1] as string;
        const date = dates[2] as string;
        return { month, date };
      } else {
        return null;
      }
    };

    const getCommDateForm = (date: {
      year: string;
      month: string;
      date: string;
    }) => {
      return getKRTime(date.year + '-' + date.month + '-' + date.date);
    };

    try {
      const response = await fetch(`${this.url}/admin/news/title?search=`);
      const body = await response.json();
      const newsTitles = body.result.news as Array<{
        _id: string;
        title: string;
      }>;
      for (const i in newsTitles) {
        const newsTitle = newsTitles[i];
        const { _id, title } = newsTitle;

        const response = await fetch(`${this.url}/admin/news/${_id}`);
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
          const imgRsp = await fetch(`${this.url}/images/news/${_id}`);

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

        // let isOld = false;
        // let oldMaxMonth = -1;
        const newTimeline = (timeline ?? []).map((t) => {
          const { _id, date, title } = t;
          //   const krTime = getKRTime(date);

          //   if (krTime.getFullYear() == 2023) {
          //     isOld = true;
          //     oldMaxMonth = Math.max(krTime.getMonth() + 1);
          //   }
          return { date: getKRTime(date), title: title };
        });

        const newComments = Object.keys(comments ?? {}).reduce((acc, k) => {
          const cArr = comments[k];
          const newC = cArr.map((comment, idx) => {
            const newComment = {
              order: idx,
              title: comment.title,
              commentType: k,
              comment: comment.comment,
              date: null,
            };
            return newComment;
          });
          return [...acc, ...newC];
        }, []);

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
          subTitle: '',
          slug: '',
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
