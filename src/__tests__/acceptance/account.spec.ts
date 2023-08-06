import {Client, expect} from '@loopback/testlab';
import sinon from 'sinon';
import {UserMsApplication} from '../../application';
import {Account, Permissions} from '../../models';
import {AccountRepository} from '../../repositories';
import {Credentials, NewAccount} from '../../schemas';
import {
  AccountService,
  TasksQueuesService,
  TokenService,
  TokenServiceBindings,
} from '../../services';
import {givenClient, givenRunningApp} from '../helpers/app.helpers';
import {
  givenAccount,
  givenEmptyDatabase,
  givenRepositories,
} from '../helpers/database.helpers';
import {givenServices} from '../helpers/services.helpers';

describe('e2e - Account Controller', () => {
  // Sinon sandbox
  const sandbox = sinon.createSandbox();
  // App and client
  let app: UserMsApplication;
  let client: Client;
  // Repositories
  let accountRepository: AccountRepository;
  // Services
  let accountService: AccountService;
  let customTokenService: TokenService;
  // Auth endpoints
  const signup = '/auth/sign-up';
  const login = '/auth/login';
  // Endpoints to test
  const reqEmailVerification = '/account/request-email-verification';
  const verifyEmail = '/account/verify-email';

  before(async () => {
    app = await givenRunningApp();
    client = await givenClient(app);
    await app.get('services.TasksQueuesService');

    ({accountRepository} = givenRepositories());
    ({accountService} = await givenServices());
    customTokenService = await app.get(TokenServiceBindings.TOKEN_SERVICE);
  });

  beforeEach(async () => {
    await givenEmptyDatabase();
  });

  after(async () => {
    await app.stop();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Email query creation - ${reqEmailVerification} Endpoint`, () => {
    it('Creates the email verification request', async () => {
      const newUser: NewAccount = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      let response = await client.post(signup).send(newUser);
      const expectedAccount = response.body as Account;

      const credentials: Credentials = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post(login).send(credentials);

      const {token} = response.body;
      response = await client
        .post(reqEmailVerification)
        .set('Authorization', `Bearer: ${token}`)
        .expect(200)
        .send();

      // Check the result
      const responseBody = response.body as Account;
      expect(responseBody.id).to.be.equal(expectedAccount.id);
      expect(responseBody.username).to.be.equal(expectedAccount.username);
      expect(responseBody.email).to.be.equal(expectedAccount.email);
      expect(responseBody.isEmailVerified).to.be.False();
    });

    it('Reject when does not has request email verification permission', async () => {
      const newUser: NewAccount = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      let response = await client.post(signup).send(newUser);
      const accountId = response.body.id;

      await accountRepository.updateById(accountId, {
        isEmailVerified: true,
      });

      const credentials: Credentials = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post(login).send(credentials);

      const {token} = response.body;
      await client
        .post(reqEmailVerification)
        .set('Authorization', `Bearer: ${token}`)
        .expect(403)
        .send();
    });

    it('Reject when the user email it has already been verified', async () => {
      const newUser: NewAccount = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      let response = await client.post(signup).send(newUser);
      const accountId = response.body.id;

      const credentials: Credentials = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post(login).send(credentials);

      await accountRepository.updateById(accountId, {
        isEmailVerified: true,
      });

      const {token} = response.body;
      await client
        .post(reqEmailVerification)
        .set('Authorization', `Bearer: ${token}`)
        .expect(400)
        .send();
    });

    it('Does not find the account to verify the email', async () => {
      const newUser: NewAccount = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      let response = await client.post(signup).send(newUser);
      const accountId = response.body.id;

      const credentials: Credentials = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post(login).send(credentials);
      await accountRepository.deleteById(accountId);

      const {token} = response.body;
      await client
        .post(reqEmailVerification)
        .set('Authorization', `Bearer: ${token}`)
        .expect(404)
        .send();
    });

    it('Fails when it can not enqueue the email tasks', async () => {
      const emailQueueStub = sandbox
        .stub(TasksQueuesService.verificationEmailQueue, 'add')
        .throws('Some error');

      const newUser: NewAccount = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      await client.post(signup).send(newUser);

      const credentials: Credentials = {
        username: newUser.username,
        password: newUser.password,
      };
      const response = await client.post(login).send(credentials);

      const {token} = response.body;
      await client
        .post(reqEmailVerification)
        .set('Authorization', `Bearer: ${token}`)
        .expect(500)
        .send();

      expect(emailQueueStub.calledOnce).to.be.True();
      expect(emailQueueStub.threw()).to.be.True();
    });
  });

  describe(`Verify Email - ${verifyEmail} Endpoint`, () => {
    it('Verifies an email when a valid token is provided', async () => {
      // Creates a new Dummy account
      const partialAccount = givenAccount();
      const account = await accountRepository.create(partialAccount);
      // Get the user profile related to the account
      const userProfile = accountService.convertToUserProfile(account, [
        Permissions.VERIFY_EMAIL,
      ]);

      // Generate the verification token
      const verificationToken = await customTokenService.generateToken(
        userProfile,
      );

      // Calls the endpoint to verify the email
      const response = await client
        .patch(verifyEmail)
        .set('Authorization', `Bearer: ${verificationToken}`)
        .send();

      // Check the response
      const updatedAccount = response.body as Account;
      expect(response.statusCode).to.be.equal(200);
      expect(updatedAccount.id).to.be.equal(account.id);
      expect(updatedAccount.email).to.be.equal(account.email);
      expect(updatedAccount.username).to.be.equal(account.username);
      expect(updatedAccount.isEmailVerified).to.be.True();
    });

    it('Fails when the account is not found', async () => {
      // Creates a new Dummy account
      const partialAccount = givenAccount();
      const account = await accountRepository.create(partialAccount);
      // Get the user profile related to the account
      const userProfile = accountService.convertToUserProfile(account, [
        Permissions.VERIFY_EMAIL,
      ]);

      // Generate the verification token
      const verificationToken = await customTokenService.generateToken(
        userProfile,
      );

      // Delete the account
      await accountRepository.deleteById(account.id);

      // Calls the endpoint to verify the email
      const response = await client
        .patch(verifyEmail)
        .set('Authorization', `Bearer: ${verificationToken}`)
        .send();

      expect(response.statusCode).to.be.equal(404);
      expect(response.body.error.message).to.be.equal(
        'The requester account was not found',
      );
    });

    it('Rejects when token is not provided', async () => {
      // Creates a new Dummy account
      const partialAccount = givenAccount();
      await accountRepository.create(partialAccount);

      // Calls the endpoint to verify the email
      await client.patch(verifyEmail).send().expect(401);
    });

    it('Rejects when user does not have the right permissions', async () => {
      // Creates a new Dummy account
      const partialAccount = givenAccount();
      const account = await accountRepository.create(partialAccount);

      const permissions = [
        Permissions.RECOVER_PASSWORD,
        Permissions.REGULAR,
        Permissions.REQUEST_EMAIL_VERIFICATION,
      ];

      for (const permission of permissions) {
        // Get the user profile related to the account
        const userProfile = accountService.convertToUserProfile(account, [
          permission,
        ]);

        // Generate the verification token
        const verificationToken = await customTokenService.generateToken(
          userProfile,
        );

        // Calls the endpoint to verify the email
        await client
          .patch(verifyEmail)
          .set('Authorization', `Bearer: ${verificationToken}`)
          .send()
          .expect(403);
      }
    });
  });
});
