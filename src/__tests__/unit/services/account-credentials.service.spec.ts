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

  it('Get the account credentials by the account id', async () => {
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

  it('Account credentials as null when account id does not exist', async () => {
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
