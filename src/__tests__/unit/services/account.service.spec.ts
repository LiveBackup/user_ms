import {securityId} from '@loopback/security';
import {expect} from '@loopback/testlab';
import {Account, Permissions} from '../../../models';
import {AccountRepository} from '../../../repositories';
import {AccountService} from '../../../services';
import {
  givenAccount,
  givenEmptyDatabase,
  givenRepositories,
} from '../../helpers/database.helpers';
import {givenServices} from '../../helpers/services.helpers';

describe('Unit testing - Account Service', () => {
  let accountRepository: AccountRepository;
  let accountService: AccountService;

  before(async () => {
    ({accountRepository} = givenRepositories());
    ({accountService} = await givenServices());
  });

  beforeEach(async () => {
    await givenEmptyDatabase();
  });

  it('Creates a new Account', async () => {
    const account = new Account(givenAccount());
    await accountService.create(account);

    const savedAccount = await accountRepository.findOne({
      where: {email: account.email},
    });
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
    let exists = await accountService.existByEmailOrUsername(
      account2.email,
      account2.username,
    );

    expect(exists).to.be.true();

    // The account 3 has the same username of the account 1
    const account3 = new Account(
      givenAccount({email: 'jpreciado@livebackup.com'}),
    );

    // Both accounts have the same email
    exists = await accountService.existByEmailOrUsername(
      account3.email,
      account3.username,
    );

    expect(exists).to.be.true();
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

  it('Verify if exist an account by either email or username', async () => {
    const account1 = new Account(givenAccount());
    await accountService.create(account1);

    const account2 = new Account(
      givenAccount({
        username: 'jdiegopm12',
        email: 'jpreciado@livebackup.com',
      }),
    );

    // The accounts have different usernames and emails
    let exists = await accountService.existByEmailOrUsername(
      account1.email,
      account2.username,
    );
    expect(exists).to.be.true();

    exists = await accountService.existByEmailOrUsername(
      account2.email,
      account1.username,
    );
    expect(exists).to.be.true();
  });

  it('Verify if does not exist an account by either email or username', async () => {
    const account1 = new Account(givenAccount());
    await accountService.create(account1);

    const account2 = new Account(
      givenAccount({
        username: 'jdiegopm12',
        email: 'jpreciado@livebackup.com',
      }),
    );

    // The accounts have different usernames and emails
    const exists = await accountService.existByEmailOrUsername(
      account2.email,
      account2.username,
    );

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

  it('Converts an account to a UserProfile', () => {
    const accountMock = givenAccount();
    const account = new Account(accountMock);

    const userProfile = accountService.convertToUserProfile(account, [
      Permissions.REGULAR,
    ]);

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
