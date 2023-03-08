import {AccountService} from '../../services';
import {givenRepositories} from './database.helpers';

export const givenServices = async function () {
  const {accountRepository, accountCredentialsRepository} = givenRepositories();

  const accountService = new AccountService(accountRepository, accountCredentialsRepository);

  return {
    accountService,
  };
};
