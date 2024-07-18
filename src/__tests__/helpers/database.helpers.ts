import {
  AccountCredentialsLb4Repository,
  AccountLb4Repository,
  TokenLb4Repository,
} from '../../repositories';
import {userTestDB} from '../fixtures/datasources';

// Clear the testing database
export const givenEmptyDatabase = async function () {
  const {accountRepository, accountCredentialsRepository, tokenRepository} =
    givenRepositories();

  await tokenRepository.deleteAll();
  await accountCredentialsRepository.deleteAll();
  await accountRepository.deleteAll();
};

/* eslint-disable prefer-const */
export const givenRepositories = function () {
  let accountRepository: AccountLb4Repository;
  let accountCredentialsRepository: AccountCredentialsLb4Repository;
  let tokenRepository: TokenLb4Repository;

  accountRepository = new AccountLb4Repository(
    userTestDB,
    async () => accountCredentialsRepository,
    async () => tokenRepository,
  );

  accountCredentialsRepository = new AccountCredentialsLb4Repository(
    userTestDB,
    async () => accountRepository,
  );

  tokenRepository = new TokenLb4Repository(
    userTestDB,
    async () => accountRepository,
  );

  return {
    accountRepository,
    accountCredentialsRepository,
    tokenRepository,
  };
};
/* eslint-enable prefer-const */
