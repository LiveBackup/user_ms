import {Client, createRestAppClient} from '@loopback/testlab';
import {UserMsApplication} from '../../application';
import {tasksQueuesTestdb, userTestdb} from '../fixtures/datasources';

export const givenRunningApp = async function (): Promise<UserMsApplication> {
  const app: UserMsApplication = new UserMsApplication({});
  await app.boot();

  // Setup the app database and starts it
  app.bind('datasources.user_db').to(userTestdb);
  app.bind('datasources.tasks_queues').to(await tasksQueuesTestdb);
  await app.start();

  return app;
};

export const givenClient = async function (
  app: UserMsApplication,
): Promise<Client> {
  return createRestAppClient(app);
};
