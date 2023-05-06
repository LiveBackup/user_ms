import {juggler} from '@loopback/repository';

const config = {
  name: 'user_testdb',
  connector: 'memory',
};

export const userTestdb: juggler.DataSource = new juggler.DataSource(config);
