import {ValueOrPromise} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {RedisMemoryServer} from 'redis-memory-server';

const testRedisDB = new RedisMemoryServer();

const config = {
  name: 'tasks_queues_testdb',
  connector: 'memory',
  host: '',
  port: -1,
};

export const tasksQueuesTestdb: ValueOrPromise<juggler.DataSource> =
  new Promise(res => {
    Promise.all([testRedisDB.getHost(), testRedisDB.getPort()])
      .then(([host, port]) => {
        config.host = host;
        config.port = port;
        res(new juggler.DataSource(config));
      })
      .catch(() => {});
  });
