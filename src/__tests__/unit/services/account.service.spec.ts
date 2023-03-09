import {
  expect
} from '@loopback/testlab';
import {Account} from '../../../models';
import {AccountRepository} from '../../../repositories';
import {AccountCredentialsService, AccountService} from '../../../services';
import {givenAccount, givenAccountCredentials, givenEmptyDatabase, givenRepositories} from '../../helpers/database.helpers';
import {givenServices} from '../../helpers/services.helpers';

describe('Unit testing - AccountCredentials Model', () => {

  let accountRepository: AccountRepository;
  let accountService: AccountService;
  let accountCredentialsService: AccountCredentialsService;

  before(async () => {
    ({accountRepository} = givenRepositories());
    ({accountService, accountCredentialsService} = givenServices());
  });

  beforeEach(async () => {
    givenEmptyDatabase();
  });

  describe('Passwords hashing and verification', () => {
    it('Hash a password', async () => {
      const accountCredentials = givenAccountCredentials({password: 'testing_password'});
      accountCredentials.password = await accountCredentialsService
        .hashPassword(accountCredentials.password);

      expect(accountCredentials.password).not.to.be.equal('testing_password');
    });

    it('Verify successfully the right password', async () => {
      const password = 'testing_password'
      const accountCredentials = givenAccountCredentials({password});
      accountCredentials.password = await accountCredentialsService
        .hashPassword(password);

      const validPassword = await accountCredentialsService
        .verifyPassword(password, accountCredentials.password);
      expect(validPassword).to.be.true();
    });

    it('Reject the wrong password', async () => {
      const accountCredentials = givenAccountCredentials({password: 'testing_password'});
      accountCredentials.password = await accountCredentialsService
        .hashPassword(accountCredentials.password);

      const validPassword = await accountCredentialsService
        .verifyPassword('Another password', accountCredentials.password);
      expect(validPassword).to.be.false();
    });
  });

  describe('Database methods', () => {
    it('Creates a new Account', async () => {
      const account = new Account(givenAccount());
      await accountService.create(account);

      const savedAccount = await accountRepository.findOne({where: {email: account.email}});
      expect(savedAccount).not.to.be.null();
      expect(savedAccount?.email).to.be.equal(account.email);
      expect(savedAccount?.username).to.be.equal(account.username);
    });

    it('Verify when already exists an account with some given email or username', async () => {
      const account1 = new Account(givenAccount());
      await accountService.create(account1);

      // The account 2 has the same email of the account 1
      const account2 = new Account(givenAccount({username: 'jdiegopm12'}));

      // Both accounts have the same email
      let exists = await accountService
        .existByEmailOrUsername(account2.email, account2.username);

      expect(exists).to.be.true();

      // The account 3 has the same username of the account 1
      const account3 = new Account(givenAccount({email: 'jpreciado@livebackup.com'}));

      // Both accounts have the same email
      exists = await accountService
        .existByEmailOrUsername(account3.email, account3.username);

      expect(exists).to.be.true();
    });

    it('Verify when does not exist an account with some given email or username', async () => {
      const account1 = new Account(givenAccount());
      await accountService.create(account1);

      const account2 = new Account(givenAccount({
        username: 'jdiegopm12',
        email: 'jpreciado@livebackup.com',
      }));

      // The accounts have different usernames and emails
      let exists = await accountService
        .existByEmailOrUsername(account2.email, account2.username);

      expect(exists).to.be.false();
    });

    it('Finds an account by its email', async () => {
      const account = new Account(givenAccount());
      await accountService.create(account);

      const savedAccount = await accountService.findByEmail(account.email);
      expect(savedAccount).not.to.be.null();
      expect(savedAccount?.email).to.be.equal(account.email);
      expect(savedAccount?.username).to.be.equal(account.username);
    });

    it('Finds an account by its username', async () => {
      const account = new Account(givenAccount());
      await accountService.create(account);

      const savedAccount = await accountService.findByUsername(account.username);
      expect(savedAccount).not.to.be.null();
      expect(savedAccount?.email).to.be.equal(account.email);
      expect(savedAccount?.username).to.be.equal(account.username);
    });

    it('Creates the Account Credentials', async () => {
    });
  });
});
