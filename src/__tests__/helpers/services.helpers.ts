import {
  AccountCredentialsService,
  AccountService,
  TasksQueuesService,
} from '../../services';
import {tasksQueuesTestdb} from '../fixtures/datasources';
import {givenRepositories} from './database.helpers';

export const givenServices = async function () {
  const {accountRepository, accountCredentialsRepository} = givenRepositories();
  const tasksQueueDB = await tasksQueuesTestdb;

  const accountService = new AccountService(accountRepository);
  const accountCredentialsService = new AccountCredentialsService(
    accountCredentialsRepository,
  );
  const tasksQueuesService = new TasksQueuesService(tasksQueueDB);

  return {
    accountService,
    accountCredentialsService,
    tasksQueuesService,
  };
};
