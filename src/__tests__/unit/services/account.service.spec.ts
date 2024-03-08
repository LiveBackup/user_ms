import {securityId} from '@loopback/security';
import {expect} from '@loopback/testlab';
import {Account, Permissions} from '../../../models';
import {AccountService} from '../../../services';
import {givenAccount, givenEmptyDatabase} from '../../helpers/database.helpers';
import {givenServices} from '../../helpers/services.helpers';

describe('Unit testing - Account Service', () => {
  let accountService: AccountService;

  before(async () => {
    ({accountService} = await givenServices());
  });

  beforeEach(async () => {
    await givenEmptyDatabase();
  });

  describe('Create account method', () => {
    it('Creates a new Account', async () => {
      // Create the test account
      const account = givenAccount({id: undefined});

      // Save the account and check the result
      const savedAccount = await accountService.create(account);
      expect(savedAccount.id).not.to.be.null();
      expect(savedAccount.email).to.be.equal(account.email);
      expect(savedAccount.username).to.be.equal(account.username);
      expect(savedAccount.registeredAt).not.to.be.null();
    });

    it('Fails for duplicated email', async () => {
      // Create the test accounts
      const account1 = givenAccount({id: undefined, username: 'jdiegopm'});
      const account2 = givenAccount({id: undefined, username: 'jdiegopm12'});

      // Save the first account
      await accountService.create(account1);
      // Expect the second one to fail
      await expect(accountService.create(account2)).to.be.rejectedWith(
        `Duplicated (email) with value (${account2.email})`,
      );
    });

    it('Fails fro duplicated username', async () => {
      // Create the test accounts
      const account1 = givenAccount({id: undefined, email: 'test@email.com'});
      const account2 = givenAccount({id: undefined, email: 'test2@email.com'});

      // Save the first account
      await accountService.create(account1);
      // Expect the second one to fail
      await expect(accountService.create(account2)).to.be.rejectedWith(
        `Duplicated (username) with value (${account2.username})`,
      );
    });
  });

  it('Find an user by its account id', async () => {
    const account1 = new Account(givenAccount());
    const createdAccount = await accountService.create(account1);

    const searchedAccount1 = await accountService.findById(createdAccount.id);
    expect(searchedAccount1).not.to.be.null();
    expect(searchedAccount1?.email).to.be.equal(createdAccount.email);
    expect(searchedAccount1?.username).to.be.equal(createdAccount.username);

    const searchedAccount2 = await accountService.findById('createdAccount.id');
    expect(searchedAccount2).to.be.null();
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

  it('Converts an account to a UserProfile', () => {
    const accountMock = givenAccount();
    const account = new Account(accountMock);

    const userProfile = accountService.convertToUserProfile(
      account,
      Permissions.REGULAR,
    );

    expect(userProfile[securityId]).to.be.equal(account.id);
    expect(userProfile.username).to.be.equal(account.username);
    expect(userProfile.email).to.be.equal(account.email);
  });

  it('Update the account info by its id', async () => {
    // Creates the account
    const accountMock = givenAccount({isEmailVerified: false});
    const account = await accountService.create(accountMock);

    const newAccountData: Partial<Account> = {
      email: 'newemail@gmail.com',
      isEmailVerified: true,
    };

    // Update the account info
    const accountUpdated = await accountService.updateById(
      account.id,
      newAccountData,
    );
    // Check the result
    expect(accountUpdated).not.be.be.null();
    expect(accountUpdated?.id).to.be.equal(account.id);
    expect(accountUpdated?.username).to.be.equal(account.username);
    expect(accountUpdated?.email).not.to.be.equal(account.email);
    expect(accountUpdated?.isEmailVerified).not.to.be.equal(
      account.isEmailVerified,
    );
  });

  it('Returns null updating account info if id does not match', async () => {
    const newAccountData: Partial<Account> = {
      email: 'newemail@gmail.com',
      isEmailVerified: true,
    };

    const updatedAccount = await accountService.updateById(
      'id',
      newAccountData,
    );
    expect(updatedAccount).to.be.Null();
  });
});
