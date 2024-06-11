import {
  AccountCredentialsService,
  AccountService,
  TasksQueuesService,
  TokenService,
} from '../../services';
import {tasksQueuesTestDB} from '../fixtures/datasources';
import {givenRepositories} from './database.helpers';

export const givenServices = async function () {
  const {accountRepository, accountCredentialsRepository, tokenRepository} =
    givenRepositories();
  const tasksQueueDB = await tasksQueuesTestDB;

  const accountService = new AccountService(
    accountRepository,
    accountCredentialsRepository,
  );
  const accountCredentialsService = new AccountCredentialsService(
    accountCredentialsRepository,
  );
  const tasksQueuesService = new TasksQueuesService(tasksQueueDB);

  const tokenService = new TokenService(
    tokenRepository,
    'secret_123',
    3600000,
    3600000,
    3600000,
  );

  return {
    accountService,
    accountCredentialsService,
    tasksQueuesService,
    tokenService,
  };
};
