import {BindingKey} from '@loopback/core';

export type TasksQueuesConfig = {
  host: string;
  port: number;
  db?: number;
  password?: string;
};

export namespace TasksQueuesBindings {
  export const TASKS_QUEUES_CONFIG = BindingKey.create<TasksQueuesConfig>(
    'datasources.config.tasks_queues',
  );
}

export const tasksQueuesConfig: TasksQueuesConfig = {
  host: process.env.TASKS_QUEUE_HOST ?? 'localhost',
  port: Number(process.env.TASKS_QUEUE_PORT ?? 6379),
  db: Number(process.env.TASKS_QUEUE_DATABASE),
  password: process.env.TASKS_QUEUE_PASSWORD,
};
