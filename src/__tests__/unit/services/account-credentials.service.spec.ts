import {expect} from '@loopback/testlab';
import {Account, AccountCredentials} from '../../../models';
import {AccountCredentialsService, AccountService} from '../../../services';
import {
  givenAccount,
  givenAccountCredentials,
  givenEmptyDatabase,
} from '../../helpers/database.helpers';
import {givenServices} from '../../helpers/services.helpers';

describe('Unit testing - AccountCredentials service', () => {
  let accountService: AccountService;
  let accountCredentialsService: AccountCredentialsService;

  before(async () => {
    ({accountService, accountCredentialsService} = await givenServices());
  });

  beforeEach(async () => {
    await givenEmptyDatabase();
  });

  describe('Passwords hashing and verification', () => {
    it('Hash a password', async () => {
      const accountCredentials = givenAccountCredentials({
        password: 'testing_password',
      });
      accountCredentials.password =
        await accountCredentialsService.hashPassword(
          accountCredentials.password,
        );

      expect(accountCredentials.password).not.to.be.equal('testing_password');
    });

    it('Verify successfully the right password', async () => {
      const password = 'testing_password';
      const accountCredentials = givenAccountCredentials({password});
      accountCredentials.password =
        await accountCredentialsService.hashPassword(password);

      const validPassword = await accountCredentialsService.verifyPassword(
        password,
        accountCredentials.password,
      );
      expect(validPassword).to.be.true();
    });

    it('Reject the wrong password', async () => {
      const accountCredentials = givenAccountCredentials({
        password: 'testing_password',
      });
      accountCredentials.password =
        await accountCredentialsService.hashPassword(
          accountCredentials.password,
        );

      const validPassword = await accountCredentialsService.verifyPassword(
        'Another password',
        accountCredentials.password,
      );
      expect(validPassword).to.be.false();
    });
  });

  describe('Account credentials creation', () => {
    it('Creates the Account Credentials', async () => {
      // Create the Account
      let account = givenAccount();
      account = await accountService.create(new Account(account));

      // Create the account creadential partial object
      const accountCredentials = givenAccountCredentials({
        accountId: account.id,
      });

      // Store the account credentials in DB
      const dbAccountCredentials = await accountCredentialsService.create(
        new AccountCredentials(accountCredentials),
      );

      // Check the results
      expect(dbAccountCredentials).not.to.be.null();
      expect(dbAccountCredentials.id).not.to.be.empty();
      expect(dbAccountCredentials.password).to.be.equal(
        accountCredentials.password,
      );
    });
  });

  describe('Get by Id', () => {
    it('Get the credentials when id exists', async () => {
      // Create the account
      const mockAccount = givenAccount();
      const account = await accountService.create(mockAccount);

      // Create the mock credentials
      const mockCredentials = givenAccountCredentials({accountId: account.id});
      await accountCredentialsService.create(mockCredentials);

      // Get the credentials by its id
      const credentials = await accountCredentialsService.findById(
        mockCredentials.id,
      );

      // Check the result
      expect(credentials).not.to.be.Null();
      expect(credentials?.accountId).to.be.equal(account.id);
    });

    it('Returns null if the id does not exist', async () => {
      // Get the credentials by its id
      const credentials = await accountCredentialsService.findById('some id');

      // Check the result
      expect(credentials).to.be.Null();
    });
  });

  describe('Get by account id', () => {
    it('Get the account credentials using the account id', async () => {
      let account = givenAccount();
      account = await accountService.create(new Account(account));

      const accountCredentialsToCreate = givenAccountCredentials({
        accountId: account.id,
      });
      await accountCredentialsService.create(
        new AccountCredentials(accountCredentialsToCreate),
      );

      const createdAccountCredentials =
        await accountCredentialsService.findCredentialsByAccountId(account.id);

      expect(createdAccountCredentials).not.to.be.null();
      expect(createdAccountCredentials?.password).not.to.be.empty();
    });

    it('Returns credentials as null if account does not exist', async () => {
      let account = givenAccount();
      account = await accountService.create(new Account(account));

      const accountCredentialsToCreate = givenAccountCredentials({
        accountId: 'account.id',
      });
      await accountCredentialsService.create(
        new AccountCredentials(accountCredentialsToCreate),
      );

      const createdAccountCredentials =
        await accountCredentialsService.findCredentialsByAccountId(account.id);

      expect(createdAccountCredentials).to.be.null();
    });
  });

  describe('Update by id', () => {
    let defaultCredentials: AccountCredentials;

    beforeEach(async () => {
      // Create the default account
      const mockAccount = givenAccount();
      await accountService.create(mockAccount);
      // Create the default credentials
      const mockCredentials = givenAccountCredentials({
        accountId: mockAccount.id,
      });
      defaultCredentials = await accountCredentialsService.create(
        mockCredentials,
      );
    });

    it('Updates the account credentials info when id is found', async () => {
      // New password info
      const newPassword = 'this is a new password';
      const newCredentialsData: Partial<AccountCredentials> = {
        password: await accountCredentialsService.hashPassword(newPassword),
      };

      // Update the credentials
      const credentialsUpdated = await accountCredentialsService.updateById(
        defaultCredentials.id,
        newCredentialsData,
      );
      if (!credentialsUpdated) {
        expect.fail(
          null,
          null,
          'The updated credentials should not be null',
          '',
        );
        return;
      }

      // Check only password was modified
      const passwordMatch = await accountCredentialsService.verifyPassword(
        newPassword,
        credentialsUpdated.password,
      );
      expect(passwordMatch).to.be.True();
      expect(credentialsUpdated.accountId).to.be.equal(
        defaultCredentials.accountId,
      );
    });

    it('Return null when account credentials id is not found', async () => {
      const newPassword = 'this is a new password';
      const newCredentialsData: Partial<AccountCredentials> = {
        password: await accountCredentialsService.hashPassword(newPassword),
      };

      const credentialsUpdated = await accountCredentialsService.updateById(
        'defaultCredentials.id',
        newCredentialsData,
      );
      expect(credentialsUpdated).to.be.Null();
    });
  });
});
