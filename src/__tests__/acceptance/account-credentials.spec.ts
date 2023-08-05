import {Client, expect} from '@loopback/testlab';
import sinon from 'sinon';
import {UserMsApplication} from '../../application';
import {Account, AccountCredentials} from '../../models';
import {Password} from '../../schemas';
import {
  AccountCredentialsService,
  AccountService,
  Permissions,
  TasksQueuesService,
  TokenService,
  TokenServiceBindings,
} from '../../services';
import {givenClient, givenRunningApp} from '../helpers/app.helpers';
import {
  givenAccount,
  givenAccountCredentials,
  givenEmptyDatabase,
} from '../helpers/database.helpers';
import {givenServices} from '../helpers/services.helpers';

describe('e2e - Account Credentials Controller', () => {
  // Sinon sandbox
  const sandbox = sinon.createSandbox();
  // And and client utilities for testing
  let app: UserMsApplication;
  let client: Client;
  // Services
  let accountService: AccountService;
  let accountCredentialsService: AccountCredentialsService;
  let tokenService: TokenService;
  // Account and credentials
  let defaultAccount: Account;
  let defaultCredentials: AccountCredentials;
  // Paths
  const reqPassRecovery = '/credentials/request-password-recovery';
  const updatePassword = '/credentials/update-password';

  before(async () => {
    app = await givenRunningApp();
    client = await givenClient(app);
    ({accountService, accountCredentialsService} = await givenServices());
    tokenService = await app.get(TokenServiceBindings.TOKEN_SERVICE);
  });

  beforeEach(async () => {
    await givenEmptyDatabase();

    // Create the testing account in db
    const mockAccount = givenAccount({isEmailVerified: true});
    defaultAccount = await accountService.create(mockAccount);
    // Create the testing credentials in db
    const mockCredentials = givenAccountCredentials({
      accountId: defaultAccount.id,
    });
    mockCredentials.password = await accountCredentialsService.hashPassword(
      mockCredentials.password,
    );
    defaultCredentials = await accountCredentialsService.create(
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
    it('Cretes the task to send the password recovery email', async () => {
      const recoveryRequest = {
        email: defaultAccount.email,
      };

      await client.post(reqPassRecovery).expect(204).send(recoveryRequest);
    });

    it('Does not found the email', async () => {
      const recoveryRequest = {
        email: `other${defaultAccount.email}`,
      };

      const response = await client.post(reqPassRecovery).send(recoveryRequest);
      expect(response.statusCode).to.be.equal(404);
      expect(response.body.error.message).to.be.equal(
        'There is not an account registered with the given email',
      );
    });

    it('Fails to enqueue the email sending tasks', async () => {
      const addJobStub = sandbox
        .stub(TasksQueuesService.passwordRecovery, 'add')
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
    it('Updates the password using regular and recovery tokens', async () => {
      const contexts = [
        {
          tokenPermission: Permissions.REGULAR,
          newPassword: 'regular_password',
        },
        {
          tokenPermission: Permissions.RECOVER_PASSWORD,
          newPassword: 'recover_password',
        },
      ];

      for (const context of contexts) {
        // Set the new password
        const newPassword: Password = {password: context.newPassword};
        // Generate the token
        const userProfile = accountService.convertToUserProfile(
          defaultAccount,
          [context.tokenPermission],
        );
        const token = await tokenService.generateToken(userProfile);

        // Test the endpoint
        await client
          .patch(updatePassword)
          .set('Authorization', `Bearer: ${token}`)
          .send(newPassword)
          .expect(204);

        // Check the result
        const updatedCredentials = await accountCredentialsService.findById(
          defaultCredentials.id,
        );
        if (!updatedCredentials) {
          expect.fail(null, null, 'Updated credentials should not be null', '');
          return;
        }

        const matchOldPassword = await accountCredentialsService.verifyPassword(
          newPassword.password,
          defaultCredentials.password,
        );
        const matchNewPassword = await accountCredentialsService.verifyPassword(
          newPassword.password,
          updatedCredentials.password,
        );
        expect(matchOldPassword).to.be.False();
        expect(matchNewPassword).to.be.True();
      }
    });

    it('Rejects the query if a valid token is not provided', async () => {
      const newPassword: Password = {
        password: 'new_strong_password',
      };

      await client.patch(updatePassword).send(newPassword).expect(401);
    });

    it('Rejects the query if was not called with right permissions', async () => {
      const permissions = [
        Permissions.REQUEST_EMAIL_VERIFICATION,
        Permissions.VERIFY_EMAIL,
      ];

      for (const permission of permissions) {
        const newPassword: Password = {password: 'dummy_password'};
        // Generates the token
        const userProfile = accountService.convertToUserProfile(
          defaultAccount,
          [permission],
        );
        const token = await tokenService.generateToken(userProfile);

        await client
          .patch(updatePassword)
          .set('Authorization', `Bearer ${token}`)
          .send(newPassword)
          .expect(403);
      }
    });

    it('Does not found the related account', async () => {
      const newPassword: Password = {
        password: 'new_strong_password',
      };
      // Create a dummy account to generate a valid token
      const anotherMockAccount = givenAccount({id: 'some_id'});
      const userProfile = accountService.convertToUserProfile(
        anotherMockAccount,
        [Permissions.REGULAR],
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
      const newPassword: Password = {
        password: givenAccountCredentials().password,
      };
      // Generate the token
      const userProfile = accountService.convertToUserProfile(defaultAccount, [
        Permissions.REGULAR,
      ]);
      const token = await tokenService.generateToken(userProfile);

      const response = await client
        .patch(updatePassword)
        .set('Authorization', `Bearer: ${token}`)
        .send(newPassword)
        .expect(400);

      expect(response.body.error.message).to.be.equal(
        'The new password can not be equal to current password',
      );
    });
  });
});
