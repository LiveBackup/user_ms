import {Account, AccountCredentials} from '../../models';
import {
  AccountCredentialsRepository,
  AccountRepository,
} from '../../repositories';
import {userTestdb} from '../fixtures/datasources';

// Clear the testing database
export const givenEmptyDatabase = async function () {
  const {accountRepository, accountCredentialsRepository} = givenRepositories();

  await accountCredentialsRepository.deleteAll();
  await accountRepository.deleteAll();
};

export const givenRepositories = function () {
  /* eslint-disable prefer-const */
  let accountRepository: AccountRepository;
  let accountCredentialsRepository: AccountCredentialsRepository;

  accountRepository = new AccountRepository(
    userTestdb,
    async () => accountCredentialsRepository,
  );

  accountCredentialsRepository = new AccountCredentialsRepository(
    userTestdb,
    async () => accountRepository,
  );
  /* eslint-enable prefer-const */

  return {
    accountRepository,
    accountCredentialsRepository,
  };
};

// Return and Account Object using the given data

export const givenAccount = function (data?: Partial<Account>) {
  return Object.assign(
    {
      id: '1',
      username: 'jdiegopm',
      email: 'jdiego@livebackup.com',
      isEmailVerified: true,
      registeredAt: new Date(),
    },
    data,
  );
};

// Return and AccountCredentials Object using the given data
/* eslint-disable @typescript-eslint/naming-convention */
export const givenAccountCredentials = function (
  data?: Partial<AccountCredentials>,
) {
  return Object.assign(
    {
      id: '1',
      password: 'hashed_password',
      account_id: '1',
    },
    data,
  );
};
/* eslint-enable @typescript-eslint/naming-convention */
