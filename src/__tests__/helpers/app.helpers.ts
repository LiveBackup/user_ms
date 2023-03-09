import {Client, createRestAppClient} from '@loopback/testlab';
import {UserMsApplication} from '../../application';
import {testdb} from '../../datasources';

export const givenRunningApp = async function (): Promise<UserMsApplication> {
  // FIXME: The app is running against the real db
  // FIXME: The real db must be accessible to the app to start even in test mode
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
