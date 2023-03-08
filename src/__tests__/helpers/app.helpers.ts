import {Client, createRestAppClient} from '@loopback/testlab';
import {UserMsApplication} from '../../application';
import {testdb} from '../../datasources';

export const givenRunningApp = async function (): Promise<UserMsApplication> {
  const app: UserMsApplication = new UserMsApplication({});
  await app.boot();

  // Setup the app database and starts it
  app.dataSource(testdb);
  await app.start();

  return app;
};

export const givenClient = async function (app: UserMsApplication): Promise<Client> {
  return createRestAppClient(app);
};
