import {SequenceActions} from '@loopback/rest';
import {Client, createRestAppClient} from '@loopback/testlab';
import {UserMsApplication} from '../../application';
import {tasksQueuesTestdb, userTestdb} from '../fixtures/datasources';

export const givenRunningApp = async function (): Promise<UserMsApplication> {
  const app = new UserMsApplication({});
  await app.boot();

  // Diasble logging for testing
  app.bind(SequenceActions.LOG_ERROR).to(() => {});

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
