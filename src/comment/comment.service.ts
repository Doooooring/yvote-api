import { Inject, Injectable } from '@nestjs/common';
import { CommentRepository } from 'src/repository/comment/comment.repository';

@Injectable()
export class CommentService {
  constructor(
    @Inject(CommentRepository)
    private readonly commentRepo: CommentRepository,
  ) {}

  async getCommentByCommentId(id: number) {
    return await this.commentRepo.getCommentByCommentId(id);
  }
}
