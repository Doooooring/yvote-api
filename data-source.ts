import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import * as dotenv from 'dotenv';
import { TypeormConfig } from 'src/config/typeorm.config';

dotenv.config();

const configService = new ConfigService();

const options = TypeormConfig(configService);

const dataSourceOptions = {
  ...options,
  migrations: [__dirname + `/migrations/*.{js,ts}`],
  migrationsTableName: 'migrations',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
