import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { commentType } from 'src/interface/comment';
import { Repository } from 'typeorm';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async getCommentByNewsIdAndCommentType(
    id: number,
    type: commentType,
    offset: number,
    limit: number,
  ) {
    return this.commentRepo.find({
      where: {
        news: {
          id: id,
        },
        comment: type,
      },
      order: {
        order: 'DESC',
      },
      skip: offset,
      take: limit,
    });
  }

  async getCommentAllByNewsIdAndCommentType(id: number) {
    return this.commentRepo.find({
      where: {
        news: {
          id: id,
        },
      },
    });
  }
}
