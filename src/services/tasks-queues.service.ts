import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {Queue, QueueOptions} from 'bullmq';
import {TasksQueuesDataSource} from '../datasources';
import {UserProfileRequest} from '../models';

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
  ): Promise<void> {
    try {
      await queue.add(name, data);
    } catch (error) {
      throw new HttpErrors[500]('Could not add the task to the queue');
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  async enqueueVerificationEmail(
    userProfile: UserProfileRequest,
    accessToken: string,
  ): Promise<void> {
    const queue = this.verificationEmailQueue;
    const taskName = `Verification email for ${userProfile.username}`;
    const taskData = {email: userProfile.email, accessToken};
    await this.enqueueTask(queue, taskName, taskData);
  }

  async enqueuePasswordRecoveryEmail(
    userProfile: UserProfileRequest,
    recoveryToken: string,
  ): Promise<void> {
    const queue = this.passwordRecovery;
    const taskName = `Password recovery request for ${userProfile.username}`;
    const taskData = {email: userProfile.email, recoveryToken};
    await this.enqueueTask(queue, taskName, taskData);
  }
}
