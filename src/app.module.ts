import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeormConfig } from './config/typeorm.config';
import { ImgModule } from './img/img.module';
import { KeywordModule } from './keyword/keyword.module';
import { AuthCorsMiddleware } from './middleware/auth_cors.middleware';
import { CommonCorsMiddleware } from './middleware/common_cors.middleware';
import { MigrationModule } from './migration/migration.module';
import { NewsModule } from './news/news.module';
import { CommentModule } from './comment/comment.module';
import { LlmModule } from './llm/llm.module';
import { ProposedActionModule } from './proposed-action/proposed-action.module';
import { IncidentModule } from './incident/incident.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: TypeormConfig,
      inject: [ConfigService],
    }),
    ImgModule,
    NewsModule,
    KeywordModule,
    CommentModule,
    LlmModule,
    MigrationModule,
    AuthModule,
    ProposedActionModule,
    IncidentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  corsAuthCheckPath = [
    { path: '/auth/admin/validate-session', method: RequestMethod.GET },
    { path: '/auth/admin/cookie-info', method: RequestMethod.GET },
    { path: '/auth/admin/login', method: RequestMethod.POST },
    { path: '/auth/admin/login', method: RequestMethod.OPTIONS },
    { path: '/news/edit', method: RequestMethod.POST },
    { path: '/news/edit', method: RequestMethod.OPTIONS },
    { path: '/news/edit/:id', method: RequestMethod.POST },
    { path: '/news/edit/:id', method: RequestMethod.PATCH },
    { path: '/news/edit/:id', method: RequestMethod.DELETE },
    { path: '/news/edit/:id', method: RequestMethod.OPTIONS },
    {
      path: '/news/edit/:id/comments/:commentType',
      method: RequestMethod.PATCH,
    },
    {
      path: '/news/edit/:id/comments/:commentType',
      method: RequestMethod.OPTIONS,
    },
    {
      path: '/news/edit/:id/comment_type',
      method: RequestMethod.POST,
    },
    {
      path: '/news/edit/:id/comment_type',
      method: RequestMethod.PATCH,
    },
    {
      path: '/news/edit/:id/comment_type',
      method: RequestMethod.OPTIONS,
    },
    {
      path: '/news/edit/:id/comment_type/:commentType',
      method: RequestMethod.DELETE,
    },
    {
      path: '/news/edit/:id/comment_type/:commentType',
      method: RequestMethod.OPTIONS,
    },
    { path: '/news/edit/:id/tracked', method: RequestMethod.PATCH },
    { path: '/news/edit/:id/tracked', method: RequestMethod.OPTIONS },
    { path: '/proposed-action', method: RequestMethod.POST },
    { path: '/proposed-action', method: RequestMethod.OPTIONS },
    { path: '/proposed-action', method: RequestMethod.GET },
    { path: '/proposed-action/:id', method: RequestMethod.GET },
    { path: '/proposed-action/:id', method: RequestMethod.PATCH },
    { path: '/proposed-action/:id', method: RequestMethod.OPTIONS },
    { path: '/proposed-action/:id', method: RequestMethod.DELETE },
    { path: '/proposed-action/:id/approve', method: RequestMethod.PATCH },
    { path: '/proposed-action/:id/approve', method: RequestMethod.OPTIONS },
    { path: '/proposed-action/:id/reject', method: RequestMethod.PATCH },
    { path: '/proposed-action/:id/reject', method: RequestMethod.OPTIONS },
    { path: '/proposed-action/:id/applied', method: RequestMethod.PATCH },
    { path: '/proposed-action/:id/applied', method: RequestMethod.OPTIONS },
    { path: '/incident', method: RequestMethod.POST },
    { path: '/incident', method: RequestMethod.OPTIONS },
    { path: '/incident', method: RequestMethod.GET },
    { path: '/incident/:id', method: RequestMethod.GET },
    { path: '/incident/:id', method: RequestMethod.PATCH },
    { path: '/incident/:id', method: RequestMethod.OPTIONS },
    { path: '/incident/:id', method: RequestMethod.DELETE },
    { path: '/incident/:id/dismiss', method: RequestMethod.PATCH },
    { path: '/incident/:id/dismiss', method: RequestMethod.OPTIONS },
    { path: '/incident/:id/resolve', method: RequestMethod.PATCH },
    { path: '/incident/:id/resolve', method: RequestMethod.OPTIONS },
    { path: '/keyword/edit', method: RequestMethod.POST },
    { path: '/keyword/edit', method: RequestMethod.OPTIONS },
    { path: '/keyword/edit/:id', method: RequestMethod.POST },
    { path: '/keyword/edit/:id', method: RequestMethod.PATCH },
    { path: '/keyword/edit/:id', method: RequestMethod.DELETE },
    { path: '/keyword/edit/:id', method: RequestMethod.OPTIONS },
  ];

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthCorsMiddleware).forRoutes(...this.corsAuthCheckPath);
    consumer
      .apply(CommonCorsMiddleware)
      .exclude(...this.corsAuthCheckPath)
      .forRoutes('*');
  }
}
