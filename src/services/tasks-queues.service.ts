import {BindingScope, inject, injectable} from '@loopback/core';
import {Queue, QueueOptions} from 'bullmq';
import dotenv from 'dotenv';
import {TasksQueuesDataSource} from '../datasources';

dotenv.config();

@injectable({scope: BindingScope.TRANSIENT})
export class TasksQueuesService {
  static initialized = false;
  static verificationEmailQueue: Queue;

  constructor(
    @inject('datasources.tasks_queues')
    protected tasksQueuesDataSource: TasksQueuesDataSource,
  ) {
    if (TasksQueuesService.initialized) return;

    const bullMQSettings: QueueOptions = {
      connection: {
        host: this.tasksQueuesDataSource.settings.host,
        port: this.tasksQueuesDataSource.settings.port,
        db: this.tasksQueuesDataSource.settings.db,
        password: this.tasksQueuesDataSource.settings.password,
      },
    };

    TasksQueuesService.verificationEmailQueue = new Queue(
      'VerificationEmail',
      bullMQSettings,
    );
    TasksQueuesService.initialized = true;
  }

  async enqueueVerificationEmail(
    username: string,
    email: string,
    accessToken: string,
  ): Promise<boolean> {
    try {
      await TasksQueuesService.verificationEmailQueue.add(
        `Verification email for ${username}`,
        {email, accessToken},
      );
    } catch (error) {
      return false;
    }
    return true;
  }
}
