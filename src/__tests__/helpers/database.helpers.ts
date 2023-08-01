import {Account, AccountCredentials} from '../../models';
import {
  AccountCredentialsRepository,
  AccountRepository,
  TokenRepository,
} from '../../repositories';
import {userTestdb} from '../fixtures/datasources';

// Clear the testing database
export const givenEmptyDatabase = async function () {
  const {accountRepository, accountCredentialsRepository} = givenRepositories();

  await accountCredentialsRepository.deleteAll();
  await accountRepository.deleteAll();
};

/* eslint-disable prefer-const */
export const givenRepositories = function () {
  let accountRepository: AccountRepository;
  let accountCredentialsRepository: AccountCredentialsRepository;
  let tokenRepository: TokenRepository;

  accountRepository = new AccountRepository(
    userTestdb,
    async () => accountCredentialsRepository,
  );

  accountCredentialsRepository = new AccountCredentialsRepository(
    userTestdb,
    async () => accountRepository,
  );

  tokenRepository = new TokenRepository(userTestdb);

  return {
    accountRepository,
    accountCredentialsRepository,
    tokenRepository,
  };
};
/* eslint-enable prefer-const */

// Return and Account Object using the given data

export const givenAccount = function (data?: Partial<Account>): Account {
  return Object.assign(
    {
      id: '1',
      username: 'jdiegopm',
      email: 'jdiego@livebackup.com',
      isEmailVerified: true,
      registeredAt: new Date(),
    },
    data,
  ) as Account;
};

// Return and AccountCredentials Object using the given data

export const givenAccountCredentials = function (
  data?: Partial<AccountCredentials>,
): AccountCredentials {
  return Object.assign(
    {
      id: '1',
      password: 'hashed_password',
      accountId: '1',
    },
    data,
  ) as AccountCredentials;
};
