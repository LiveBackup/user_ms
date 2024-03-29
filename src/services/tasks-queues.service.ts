import {BindingScope, inject, injectable} from '@loopback/core';
import {Queue, QueueOptions} from 'bullmq';
import {TasksQueuesDataSource} from '../datasources';

@injectable({scope: BindingScope.SINGLETON})
export class TasksQueuesService {
  // Available Queues
  public readonly verificationEmailQueue: Queue;
  public readonly passwordRecovery: Queue;

  constructor(
    @inject('datasources.tasks_queues')
    tasksQueuesDataSource: TasksQueuesDataSource,
  ) {
    const bullMQSettings: QueueOptions = {
      connection: {
        host: tasksQueuesDataSource.settings.host,
        port: tasksQueuesDataSource.settings.port,
        db: tasksQueuesDataSource.settings.db,
        username: tasksQueuesDataSource.settings.user,
        password: tasksQueuesDataSource.settings.password,
      },
    };

    this.verificationEmailQueue = new Queue(
      'VerificationEmail',
      bullMQSettings,
    );
    this.passwordRecovery = new Queue('PasswordRecovery', bullMQSettings);
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
    const queue = this.verificationEmailQueue;
    const taskName = `Verification email for ${username}`;
    const taskData = {email, accessToken};
    return this.enqueueTask(queue, taskName, taskData);
  }

  async enqueuePasswordRecoveryEmail(
    username: string,
    email: string,
    recoveryToken: string,
  ): Promise<boolean> {
    const queue = this.passwordRecovery;
    const taskName = `Password recovery request for ${username}`;
    const taskData = {email, recoveryToken};
    return this.enqueueTask(queue, taskName, taskData);
  }
}
