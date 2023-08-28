import {AES} from 'crypto-js';
import {Account, AccountCredentials, Permissions, Token} from '../../models';
import {
  AccountCredentialsRepository,
  AccountRepository,
  TokenRepository,
} from '../../repositories';
import {userTestdb} from '../fixtures/datasources';

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
  let accountRepository: AccountRepository;
  let accountCredentialsRepository: AccountCredentialsRepository;
  let tokenRepository: TokenRepository;

  accountRepository = new AccountRepository(
    userTestdb,
    async () => accountCredentialsRepository,
    async () => tokenRepository,
  );

  accountCredentialsRepository = new AccountCredentialsRepository(
    userTestdb,
    async () => accountRepository,
  );

  tokenRepository = new TokenRepository(
    userTestdb,
    async () => accountRepository,
  );

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

export const givenToken = function (
  data?: Partial<Token>,
  secret?: string,
): Token {
  return Object.assign(
    {
      id: '1-2-3-4-5',
      tokenSecret: AES.encrypt('6-7-8-9-0', secret ?? 'secret'),
      allowedActions: [Permissions.REGULAR],
      expirationDate: new Date(new Date().valueOf() + 3600),
      accountId: '1-1-1',
    },
    data,
  ) as Token;
};
