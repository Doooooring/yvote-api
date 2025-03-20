import { Inject, Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/openai/openai.service';
import { CommentRepository } from 'src/repository/comment/comment.repository';

@Injectable()
export class CommentService {
  constructor(
    @Inject(CommentRepository)
    private readonly commentRepo: CommentRepository,
    @Inject(OpenAIService)
    private readonly openAIService: OpenAIService,
  ) {}

  async getCommentByCommentId(id: number) {
    return await this.commentRepo.getCommentByCommentId(id);
  }
}
