import {juggler} from '@loopback/repository';

const config = {
  name: 'user_testdb',
  connector: 'memory',
};

export const userTestDB: juggler.DataSource = new juggler.DataSource(config);
