import {AccountCredentialsService, AccountService} from '../../services';
import {givenRepositories} from './database.helpers';

export const givenServices = function () {
  const {accountRepository, accountCredentialsRepository} = givenRepositories();

  const accountService = new AccountService(accountRepository);
  const accountCredentialsService = new AccountCredentialsService(
    accountCredentialsRepository,
  );

  return {
    accountService,
    accountCredentialsService,
  };
};
