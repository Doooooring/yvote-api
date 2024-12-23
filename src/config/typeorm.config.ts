import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Comment } from 'src/entity/comment.entity';
import { Keyword } from 'src/entity/keyword.entity';
import { News } from 'src/entity/news.entity';
import { Timeline } from 'src/entity/timeline.entity';
import { User } from 'src/entity/user.entity';
import { Vote } from 'src/entity/vote.entity';

export const TypeormConfig = (configService: ConfigService) => {
  const type = 'mysql';
  const host = '127.0.0.1';
  const port = 3306;
  const database = 'test1';
  const username = configService.get('DB_USER_NAME');
  const password = configService.get('DB_PASSWORD');

  const option: TypeOrmModuleOptions = {
    type,
    host,
    port,
    database,
    username,
    password,
    entities: [News, Keyword, Comment, Timeline, User, Vote],
    autoLoadEntities: true,
    synchronize: false,
  };

  return option;
};
