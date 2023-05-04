import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  name: 'tasks_queues',
  connector: 'kv-redis',
  host: process.env.TASKS_QUEUE_HOST ?? 'localhost',
  port: Number(process.env.TASKS_QUEUE_PORT ?? 6379),
  db: process.env.USER_DB_DATABASE,
  user: process.env.USER_DB_USER,
  password: process.env.TASKS_QUEUE_PASSWORD,
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class TasksQueuesDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'tasks_queues';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.tasks_queues', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
