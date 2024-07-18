import {Client, expect} from '@loopback/testlab';
import {compare, genSalt, hash} from 'bcryptjs';
import sinon from 'sinon';
import {UserMsApplication} from '../../application';
import {UpdatePasswordDto} from '../../dtos';
import {Account, Credentials, Permission} from '../../models';
import {
  IAccountCredentialsRepository,
  IAccountRepository,
} from '../../repositories';
import {
  AccountService,
  TasksQueuesService,
  TokenService,
  TokenServiceBindings,
} from '../../services';
import {givenClient, givenRunningApp} from '../helpers/app.helpers';
import {
  givenEmptyDatabase,
  givenRepositories,
} from '../helpers/database.helpers';
import {givenAccount, givenAccountCredentials} from '../helpers/models';
import {givenServices} from '../helpers/services.helpers';

describe('e2e - Account Credentials Controller', () => {
  // Sinon sandbox
  const sandbox = sinon.createSandbox();
  // And and client utilities for testing
  let app: UserMsApplication;
  let client: Client;
  // Repositories
  let accountRepository: IAccountRepository;
  let accountCredentialsRepository: IAccountCredentialsRepository;
  // Services
  let accountService: AccountService;
  let tokenService: TokenService;
  let tasksQueuesService: TasksQueuesService;
  // Account and credentials
  let defaultAccount: Account;
  let defaultCredentials: Credentials;
  // Paths
  const reqPassRecovery = '/credentials/request-password-recovery';
  const updatePassword = '/credentials/update-password';

  before(async () => {
    app = await givenRunningApp();
    client = await givenClient(app);
    ({accountRepository, accountCredentialsRepository} = givenRepositories());
    ({accountService} = await givenServices());
    tokenService = await app.get(TokenServiceBindings.TOKEN_SERVICE);
    tasksQueuesService = await app.get('services.TasksQueuesService');
  });

  beforeEach(async () => {
    await givenEmptyDatabase();

    // Create the testing account in db
    const mockAccount = givenAccount({isEmailVerified: true});
    defaultAccount = await accountRepository.createAccount(mockAccount);
    // Create the testing credentials in db
    const mockCredentials = givenAccountCredentials({
      accountId: defaultAccount.id,
    });
    mockCredentials.password = await hash(
      mockCredentials.password,
      await genSalt(),
    );
    defaultCredentials = await accountCredentialsRepository.saveCredentials(
      mockCredentials,
    );
  });

  after(async () => {
    await app.stop();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Request password recovery - ${reqPassRecovery} Endpoint`, () => {
    it('Creates the task to send the password recovery email', async () => {
      const recoveryRequest = {
        email: defaultAccount.email,
      };

      await client.post(reqPassRecovery).expect(204).send(recoveryRequest);
    });

    it('Does not find the email', async () => {
      const recoveryRequest = {
        email: `other${defaultAccount.email}`,
      };

      const response = await client.post(reqPassRecovery).send(recoveryRequest);
      expect(response.statusCode).to.be.equal(404);
      expect(response.body.error.message).to.be.equal(
        `There is not an account with the email ${recoveryRequest.email}`,
      );
    });

    it('Fails to enqueue the email sending tasks', async () => {
      const addJobStub = sandbox
        .stub(tasksQueuesService.passwordRecovery, 'add')
        .throws('Failed to add a Job');

      const recoveryRequest = {
        email: defaultAccount.email,
      };

      const response = await client.post(reqPassRecovery).send(recoveryRequest);
      expect(response.statusCode).to.be.equal(500);
      expect(addJobStub.calledOnce).to.be.true();
      expect(addJobStub.threw()).to.be.true();
    });
  });

  describe(`Update password - ${updatePassword} Endpoint`, () => {
    it('Updates the password using regular token', async () => {
      // Set the new password
      const newPassword: UpdatePasswordDto = {password: 'regular_password'};
      // Generate the token
      const userProfile = accountService.convertToUserProfile(
        defaultAccount,
        Permission.REGULAR,
      );
      const token = await tokenService.generateToken(userProfile);

      // Test the endpoint
      await client
        .patch(updatePassword)
        .set('Authorization', `Bearer: ${token}`)
        .send(newPassword)
        .expect(204);

      // Check the result
      const updatedCredentials =
        await accountCredentialsRepository.findOneByAccountId(
          defaultCredentials.accountId,
        );
      if (!updatedCredentials) {
        expect.fail(null, null, 'Updated credentials should not be null', '');
        return;
      }

      const matchOldPassword = await compare(
        newPassword.password,
        defaultCredentials.password,
      );
      const matchNewPassword = await compare(
        newPassword.password,
        updatedCredentials.password,
      );
      expect(matchOldPassword).to.be.False();
      expect(matchNewPassword).to.be.True();

      // Try to call the endpoint again (Token should not be revoked)
      newPassword.password = 'regular_password 2.0';
      await client
        .patch(updatePassword)
        .set('Authorization', `Bearer: ${token}`)
        .send(newPassword)
        .expect(204);
    });

    it('Updates the password using recovery tokens', async () => {
      // Set the new password
      const newPassword: UpdatePasswordDto = {password: 'recover_password'};
      // Generate the token
      const userProfile = accountService.convertToUserProfile(
        defaultAccount,
        Permission.RECOVER_PASSWORD,
      );
      const token = await tokenService.generateToken(userProfile);

      // Test the endpoint
      await client
        .patch(updatePassword)
        .set('Authorization', `Bearer: ${token}`)
        .send(newPassword)
        .expect(204);

      // Check the result
      const updatedCredentials =
        await accountCredentialsRepository.findOneByAccountId(
          defaultCredentials.accountId,
        );
      if (!updatedCredentials) {
        expect.fail(null, null, 'Updated credentials should not be null', '');
        return;
      }

      const matchOldPassword = await compare(
        newPassword.password,
        defaultCredentials.password,
      );
      const matchNewPassword = await compare(
        newPassword.password,
        updatedCredentials.password,
      );
      expect(matchOldPassword).to.be.False();
      expect(matchNewPassword).to.be.True();

      // Try to call the endpoint again (Token should have been revoked)
      await client
        .patch(updatePassword)
        .set('Authorization', `Bearer: ${token}`)
        .send(newPassword)
        .expect(401);
    });

    it('Rejects the query if a valid token is not provided', async () => {
      const newPassword: UpdatePasswordDto = {
        password: 'new_strong_password',
      };

      await client.patch(updatePassword).send(newPassword).expect(401);
    });

    it('Rejects the query if was not called with right permissions', async () => {
      const permission = Permission.VERIFY_EMAIL;

      const newPassword: UpdatePasswordDto = {password: 'dummy_password'};
      // Generates the token
      const userProfile = accountService.convertToUserProfile(
        defaultAccount,
        permission,
      );
      const token = await tokenService.generateToken(userProfile);

      await client
        .patch(updatePassword)
        .set('Authorization', `Bearer ${token}`)
        .send(newPassword)
        .expect(403);
    });

    it('Does not found the related account', async () => {
      const newPassword: UpdatePasswordDto = {
        password: 'new_strong_password',
      };
      // Create a dummy account to generate a valid token
      const anotherMockAccount = givenAccount({id: 'some_id'});
      await accountRepository.createAccount(anotherMockAccount);
      const userProfile = accountService.convertToUserProfile(
        anotherMockAccount,
        Permission.REGULAR,
      );
      const token = await tokenService.generateToken(userProfile);

      const response = await client
        .patch(updatePassword)
        .set('Authorization', `Bearer: ${token}`)
        .send(newPassword)
        .expect(404);

      expect(response.body.error.message).to.be.equal(
        'The account credentials were not found',
      );
    });

    it('Rejects if the new password is same than older', async () => {
      const newPassword: UpdatePasswordDto = {
        password: givenAccountCredentials().password,
      };
      // Generate the token
      const userProfile = accountService.convertToUserProfile(
        defaultAccount,
        Permission.REGULAR,
      );
      const token = await tokenService.generateToken(userProfile);

      const response = await client
        .patch(updatePassword)
        .set('Authorization', `Bearer: ${token}`)
        .send(newPassword)
        .expect(400);

      expect(response.body.error.message).to.be.equal(
        'The new password can not be equal to old password',
      );
    });
  });
});
