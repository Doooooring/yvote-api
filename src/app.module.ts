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
    MigrationModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  corsAuthCheckPath = [
    { path: '/auth/admin/validate-session', method: RequestMethod.GET },
    { path: '/auth/admin/login', method: RequestMethod.POST },
    { path: '/auth/admin/login', method: RequestMethod.OPTIONS },
    { path: '/news/edit', method: RequestMethod.POST },
    { path: '/news/edit', method: RequestMethod.OPTIONS },
    { path: '/news/edit/:id', method: RequestMethod.POST },
    { path: '/news/edit/:id', method: RequestMethod.PATCH },
    { path: '/news/edit/:id', method: RequestMethod.DELETE },
    { path: '/news/edit/:id', method: RequestMethod.OPTIONS },
    { path: '/news/edit/:id/comments', method: RequestMethod.PATCH },
    { path: '/news/edit/:id/comments', method: RequestMethod.OPTIONS },
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
