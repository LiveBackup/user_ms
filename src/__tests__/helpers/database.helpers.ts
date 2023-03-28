import {testdb} from '../../datasources';
import {Account, AccountCredentials} from '../../models';
import {AccountCredentialsRepository, AccountRepository} from '../../repositories';

// TODO: Change e2e folder name to acceptance

// Clear the testing database
export const givenEmptyDatabase = async function () {
  const {accountRepository, accountCredentialsRepository} = givenRepositories();

  await accountCredentialsRepository.deleteAll();
  await accountRepository.deleteAll();
}

export const givenRepositories = function () {
  /* eslint-disable prefer-const */
  let accountRepository: AccountRepository;
  let accountCredentialsRepository: AccountCredentialsRepository;

  accountRepository = new AccountRepository(
    testdb,
    async () => accountCredentialsRepository,
  );

  accountCredentialsRepository = new AccountCredentialsRepository(
    testdb,
    async () => accountRepository,
  );
  /* eslint-enable prefer-const */

  return {
    accountRepository,
    accountCredentialsRepository,
  };
}

// Return and Account Object using the given data
export const givenAccount = function (data?: Partial<Account>) {
  return Object.assign(
    {
      id: '1',
      username: 'jdiegopm',
      email: 'jdiego@livebackup.com',
      is_email_verified: true, /* eslint-disable-line */
    },
    data,
  );
}

// Return and AccountCredentials Object using the given data
export const givenAccountCredentials = function (data?: Partial<AccountCredentials>) {
  return Object.assign(
    {
      id: '1',
      password: 'hashed_password',
      account_id: '1' /* eslint-disable-line */
    },
    data,
  );
}
