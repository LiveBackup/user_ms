import {securityId} from '@loopback/security';
import {expect, sinon} from '@loopback/testlab';
import {ICryptoAdapter} from '../../../adapters';
import {NewAccountRequest, Permission} from '../../../models';
import {
  IAccountCredentialsRepository,
  IAccountRepository,
} from '../../../repositories';
import {AccountService} from '../../../services';
import {
  givenAccount,
  givenAccountCredentials,
  givenExtendedUserProfile,
} from '../../helpers/models';

describe('Unit testing - Account service', () => {
  // Sandbox
  const sandbox = sinon.createSandbox();
  // Service
  let accountService: AccountService;
  // Repositories
  let accountRepository: IAccountRepository;
  let credentialsRepository: IAccountCredentialsRepository;
  // Adapters
  let cryptoAdapter: ICryptoAdapter;

  beforeEach(() => {
    accountRepository = <IAccountRepository>{};
    credentialsRepository = <IAccountCredentialsRepository>{};
    cryptoAdapter = <ICryptoAdapter>{};

    accountService = new AccountService(
      accountRepository,
      credentialsRepository,
      cryptoAdapter,
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Convert to user profile', () => {
    it('Converts an account to a UserProfileRequest', () => {
      const account = givenAccount({
        id: 'test_id',
        email: 'test@email.com',
        username: 'test_user',
      });
      const permission = Permission.REGULAR;

      // Execute the method
      const profile = accountService.convertToUserProfile(account, permission);

      // Check the result
      expect(profile[securityId]).to.be.equal(account.id);
      expect(profile.email).to.be.equal(account.email);
      expect(profile.username).to.be.equal(account.username);
      expect(profile.requestedPermission).to.be.equal(permission);
    });
  });

  describe('User account creation', () => {
    it('Creates an user account', async () => {
      // Create the mock account
      const accountToCreate: NewAccountRequest = {
        email: 'test@email.com',
        username: 'test_user',
        password: 'strong_password',
      };
      const expectedAccount = givenAccount({
        ...accountToCreate,
        isEmailVerified: false,
      });

      // Create the stubs
      accountRepository.findManyByEmailAndUsername = sandbox
        .stub()
        .returns(Promise.resolve([]));

      accountRepository.createAccount = sandbox
        .stub()
        .withArgs(accountToCreate)
        .returns(Promise.resolve(expectedAccount));

      credentialsRepository.saveCredentials = sandbox
        .stub()
        .returns(Promise.resolve(givenAccountCredentials()));

      cryptoAdapter.hashPassword = sandbox
        .stub()
        .returns(Promise.resolve('hash'));

      // Execute the method
      const createdAccount = await accountService.createUserAccount(
        accountToCreate,
      );

      // Validate the result
      expect(createdAccount.id).to.be.equal(expectedAccount.id);
      expect(createdAccount.email).to.be.equal(expectedAccount.email);
      expect(createdAccount.username).to.be.equal(expectedAccount.username);
    });

    it('Fails when the email address is not available', async () => {
      // Create the mock account
      const accountToCreate: NewAccountRequest = {
        email: 'test@email.com',
        username: 'test_user',
        password: 'strong_password',
      };

      // Create the Stubs
      accountRepository.findManyByEmailAndUsername = sandbox
        .stub()
        .returns(
          Promise.resolve([
            givenAccount({email: accountToCreate.email}),
            givenAccount({username: accountToCreate.username}),
          ]),
        );

      // Execute the method
      let error: Error | undefined = undefined;
      try {
        await accountService.createUserAccount(accountToCreate);
      } catch (err) {
        error = err;
      }

      // Validate the results
      expect(error).not.to.be.undefined();
      expect(error?.message).to.be.equal(
        'There already exists an Account with the given email',
      );
    });

    it('Fails when the username is not available', async () => {
      // Create the mock account
      const accountToCreate: NewAccountRequest = {
        email: 'test@email.com',
        username: 'test_user',
        password: 'strong_password',
      };

      // Create the Stubs
      accountRepository.findManyByEmailAndUsername = sandbox
        .stub()
        .returns(
          Promise.resolve([givenAccount({username: accountToCreate.username})]),
        );

      // Execute the method
      let error: Error | undefined = undefined;
      try {
        await accountService.createUserAccount(accountToCreate);
      } catch (err) {
        error = err;
      }

      // Validate the results
      expect(error).not.to.be.undefined();
      expect(error?.message).to.be.equal(
        'There already exists an Account with the given username',
      );
    });
  });

  describe('User login', () => {
    it('Generates a regular login request', async () => {
      // Crate the mock objects
      const mockAccount = givenAccount({isEmailVerified: true});
      mockAccount.accountCredentials = givenAccountCredentials();

      // Crete the stubs
      accountRepository.findOneByEmailOrUsername = sinon
        .stub()
        .returns(Promise.resolve(mockAccount));

      cryptoAdapter.comparePassword = sinon
        .stub()
        .returns(Promise.resolve(true));

      // Execute the method
      const userProfileRequest = await accountService.loginUser({
        usernameOrEmail: mockAccount.username,
        password: 'strong_password',
      });

      // Verify the result
      expect(userProfileRequest[securityId]).to.be.equal(mockAccount.id);
      expect(userProfileRequest.email).to.be.equal(mockAccount.email);
      expect(userProfileRequest.username).to.be.equal(mockAccount.username);
      expect(userProfileRequest.requestedPermission).to.be.equal(
        Permission.REGULAR,
      );
    });

    it('Generates a email verification login request', async () => {
      // Crate the mock objects
      const mockAccount = givenAccount({isEmailVerified: false});
      mockAccount.accountCredentials = givenAccountCredentials();

      // Crete the stubs
      accountRepository.findOneByEmailOrUsername = sinon
        .stub()
        .returns(Promise.resolve(mockAccount));

      cryptoAdapter.comparePassword = sinon
        .stub()
        .returns(Promise.resolve(true));

      // Execute the method
      const userProfileRequest = await accountService.loginUser({
        usernameOrEmail: mockAccount.username,
        password: 'strong_password',
      });

      // Verify the result
      expect(userProfileRequest[securityId]).to.be.equal(mockAccount.id);
      expect(userProfileRequest.email).to.be.equal(mockAccount.email);
      expect(userProfileRequest.username).to.be.equal(mockAccount.username);
      expect(userProfileRequest.requestedPermission).to.be.equal(
        Permission.REQUEST_EMAIL_VERIFICATION,
      );
    });

    it('Does not find any account by neither username nor email', async () => {
      // Create the stubs
      accountRepository.findOneByEmailOrUsername = sinon
        .stub()
        .returns(Promise.resolve(null));

      // Execute the method
      let error: Error | undefined = undefined;
      try {
        await accountService.loginUser({usernameOrEmail: '', password: ''});
      } catch (err) {
        error = err;
      }

      // Verify the result
      expect(error).not.to.be.undefined();
      expect(error?.message).to.be.equal('Incorrect username or password');
    });

    it('Cannot load the related credentials from DB', async () => {
      // Crete the stubs
      accountRepository.findOneByEmailOrUsername = sinon
        .stub()
        .returns(Promise.resolve(givenAccount()));

      // Execute the method
      let error: Error | undefined = undefined;
      try {
        await accountService.loginUser({usernameOrEmail: '', password: ''});
      } catch (err) {
        error = err;
      }

      // Verify the result
      expect(error).not.to.be.undefined();
      expect(error?.message).to.be.equal('User credentials not found');
    });

    it('Throws an error when passwords do not match', async () => {
      // Crate the mock objects
      const mockAccount = givenAccount({isEmailVerified: true});
      mockAccount.accountCredentials = givenAccountCredentials();

      // Crete the stubs
      accountRepository.findOneByEmailOrUsername = sinon
        .stub()
        .returns(Promise.resolve(mockAccount));

      cryptoAdapter.comparePassword = sinon
        .stub()
        .returns(Promise.resolve(false));

      // Execute the method
      let error: Error | undefined = undefined;
      try {
        await accountService.loginUser({usernameOrEmail: '', password: ''});
      } catch (err) {
        error = err;
      }

      // Verify the result
      expect(error).not.to.be.undefined();
      expect(error?.message).to.be.equal('Incorrect username or password');
    });
  });

  describe('Account search using an user profile', () => {
    it('Returns a valid account', async () => {
      // Create the mock objects
      const expectedAccount = givenAccount();
      // Create the stubs
      accountRepository.findAccountById = sinon
        .stub()
        .returns(Promise.resolve(expectedAccount));

      // Execute the method
      const account = await accountService.findWithUserProfile(
        givenExtendedUserProfile(),
      );

      // Verify the result
      expect(account.id).to.be.equal(expectedAccount.id);
    });

    it('Does not find an account', async () => {
      // Create the stubs
      accountRepository.findAccountById = sinon
        .stub()
        .returns(Promise.resolve(null));

      // Execute the method
      let error: Error | undefined = undefined;
      try {
        await accountService.findWithUserProfile(givenExtendedUserProfile());
      } catch (err) {
        error = err;
      }

      // Verify the result
      expect(error).not.to.be.undefined();
      expect(error?.message).to.be.equal('No account was found');
    });
  });

  describe('User profile generation for email verification', () => {
    it('Generates an user profile request for email verification', async () => {
      // Create the stubs
      sinon
        .stub(accountService, 'findWithUserProfile')
        .returns(Promise.resolve(givenAccount({isEmailVerified: false})));

      // Execute the method
      const userProfile = await accountService.getEmailVerificationProfile(
        givenExtendedUserProfile(),
      );

      // Verify the execution
      expect(userProfile.requestedPermission).to.be.equal(
        Permission.VERIFY_EMAIL,
      );
    });

    it('Throws an error if the email has already been verified', async () => {
      // Create the stubs
      sinon
        .stub(accountService, 'findWithUserProfile')
        .returns(Promise.resolve(givenAccount({isEmailVerified: true})));

      // Execute the method
      let error: Error | undefined = undefined;
      try {
        await accountService.getEmailVerificationProfile(
          givenExtendedUserProfile(),
        );
      } catch (err) {
        error = err;
      }

      // Verify the result
      expect(error).not.to.be.undefined();
      expect(error?.message).to.be.equal('Email has already been verified');
    });
  });

  describe('Account email verification', () => {
    it('Verifies the email address', async () => {
      // Create the stubs
      accountRepository.updateAccountById = sinon
        .stub()
        .returns(Promise.resolve(givenAccount({isEmailVerified: true})));

      // Execute hte method
      const updatedAccount = await accountService.verifyAccountEmailAddress(
        givenExtendedUserProfile(),
      );

      // Verify the result
      expect(updatedAccount.isEmailVerified).to.be.True();
    });

    it('Does not find the account to verity its email', async () => {
      // Create the stubs
      accountRepository.updateAccountById = sinon
        .stub()
        .returns(Promise.resolve(null));

      // Execute the method
      let error: Error | undefined = undefined;
      try {
        await accountService.verifyAccountEmailAddress(
          givenExtendedUserProfile(),
        );
      } catch (err) {
        error = err;
      }

      // Verify the result
      expect(error).not.to.be.undefined();
      expect(error?.message).to.be.equal('The account was not found');
    });
  });

  describe('Password recovery profile generation', () => {
    it('Generates an user profile to request the password recovery', async () => {
      // Create the stubs
      accountRepository.findAccountByEmail = sinon
        .stub()
        .returns(Promise.resolve(givenAccount()));

      // Execute the method
      const userProfile = await accountService.getPasswordRecoveryProfile({
        email: 'test@email.com',
      });

      // Verify the result
      expect(userProfile.requestedPermission).to.be.equal(
        Permission.RECOVER_PASSWORD,
      );
    });

    it('Does not find any account using the email provided', async () => {
      // Create the stubs
      accountRepository.findAccountByEmail = sinon
        .stub()
        .returns(Promise.resolve(null));

      // Execute the method
      let error: Error | undefined = undefined;
      try {
        await accountService.getPasswordRecoveryProfile({
          email: 'test@email.com',
        });
      } catch (err) {
        error = err;
      }

      // Verify the result
      expect(error).not.to.be.undefined();
      expect(error?.message).to.be.equal(
        'There is not an account with the email test@email.com',
      );
    });
  });
});
