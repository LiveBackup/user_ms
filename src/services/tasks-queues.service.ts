import {BindingScope, inject, injectable} from '@loopback/core';
import {Queue, QueueOptions} from 'bullmq';
import dotenv from 'dotenv';
import {TasksQueuesDataSource} from '../datasources';

dotenv.config();

@injectable({scope: BindingScope.TRANSIENT})
export class TasksQueuesService {
  // Service status
  static initialized = false;
  // Available Queues
  static verificationEmailQueue: Queue;
  static recoveryPasswordQueue: Queue;

  constructor(
    @inject('datasources.tasks_queues')
    tasksQueuesDataSource: TasksQueuesDataSource,
  ) {
    if (TasksQueuesService.initialized) return;

    const bullMQSettings: QueueOptions = {
      connection: {
        host: tasksQueuesDataSource.settings.host,
        port: tasksQueuesDataSource.settings.port,
        db: tasksQueuesDataSource.settings.db,
        username: tasksQueuesDataSource.settings.user,
        password: tasksQueuesDataSource.settings.password,
      },
    };

    TasksQueuesService.verificationEmailQueue = new Queue(
      'VerificationEmail',
      bullMQSettings,
    );
    TasksQueuesService.recoveryPasswordQueue = new Queue(
      'RecoveryPassword',
      bullMQSettings,
    );
    TasksQueuesService.initialized = true;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async enqueueTask(
    queue: Queue,
    name: string,
    data: any,
  ): Promise<boolean> {
    try {
      await queue.add(name, data);
      return true;
    } catch (error) {
      return false;
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  async enqueueVerificationEmail(
    username: string,
    email: string,
    accessToken: string,
  ): Promise<boolean> {
    const queue = TasksQueuesService.verificationEmailQueue;
    const taskName = `Verification email for ${username}`;
    const taskData = {email, accessToken};
    return this.enqueueTask(queue, taskName, taskData);
  }

  async enqueueRecoveryPasswordEmail(
    username: string,
    email: string,
    recoveryToken: string,
  ): Promise<boolean> {
    const queue = TasksQueuesService.recoveryPasswordQueue;
    const taskName = `Recovery password request for ${username}`;
    const taskData = {email, recoveryToken};
    return this.enqueueTask(queue, taskName, taskData);
  }
}
