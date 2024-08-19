import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

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
    autoLoadEntities: true,
    synchronize: false,
  };

  return option;
};
