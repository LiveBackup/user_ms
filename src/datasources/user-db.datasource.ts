import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  name: 'user_db',
  connector: 'postgresql',
  host: process.env.USER_DB_HOST ?? 'localhost',
  port: +(process.env.USER_DB_PORT ?? 5432),
  user: process.env.USER_DB_USER,
  password: process.env.USER_DB_PASSWORD,
  database: process.env.USER_DB_DATABASE,
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class UserDbDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'user_db';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.user_db', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
