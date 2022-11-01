import {juggler} from '@loopback/repository';

const config = {
  name: 'testdb',
  connector: 'memory',
};

export const testdb: juggler.DataSource = new juggler.DataSource(config);
