import {Client, expect} from '@loopback/testlab';
import sinon from 'sinon';
import {UserMsApplication} from '../../application';
import {LoginRequestDto, NewAccountDto} from '../../dtos';
import {Account, Permission} from '../../models';
import {IAccountRepository} from '../../repositories';
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
import {givenAccount} from '../helpers/models';
import {givenServices} from '../helpers/services.helpers';

describe('e2e - Account Controller', () => {
  // Sinon sandbox
  const sandbox = sinon.createSandbox();
  // App and client
  let app: UserMsApplication;
  let client: Client;
  // Repositories
  let accountRepository: IAccountRepository;
  // Services
  let accountService: AccountService;
  let customTokenService: TokenService;
  let tasksQueuesService: TasksQueuesService;
  // Auth endpoints
  const signup = '/auth/sign-up';
  const login = '/auth/login';
  // Endpoints to test
  const reqEmailVerification = '/account/request-email-verification';
  const verifyEmail = '/account/verify-email';

  before(async () => {
    app = await givenRunningApp();
    client = await givenClient(app);
    tasksQueuesService = await app.get('services.TasksQueuesService');

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
      const newUser: NewAccountDto = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      let response = await client.post(signup).send(newUser).expect(201);

      const credentials: LoginRequestDto = {
        usernameOrEmail: newUser.username,
        password: newUser.password,
      };
      response = await client.post(login).send(credentials).expect(200);

      const {token} = response.body;
      response = await client
        .post(reqEmailVerification)
        .set('Authorization', `Bearer: ${token}`)
        .expect(204)
        .send();
    });

    it('Reject when does not has request email verification permission', async () => {
      const newUser: NewAccountDto = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      let response = await client.post(signup).send(newUser);
      const accountId = response.body.id;

      await accountRepository.updateAccountById(accountId, {
        isEmailVerified: true,
      });

      const credentials: LoginRequestDto = {
        usernameOrEmail: newUser.username,
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
      const newUser: NewAccountDto = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      let response = await client.post(signup).send(newUser);
      const accountId = response.body.id;

      const credentials: LoginRequestDto = {
        usernameOrEmail: newUser.username,
        password: newUser.password,
      };
      response = await client.post(login).send(credentials);

      await accountRepository.updateAccountById(accountId, {
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
      // Create the new account request
      const newUser: NewAccountDto = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      // Get the generated account id
      let response = await client.post(signup).send(newUser);
      const accountId = response.body.id;

      // Log in to get a valid token
      const credentials: LoginRequestDto = {
        usernameOrEmail: newUser.username,
        password: newUser.password,
      };
      response = await client.post(login).send(credentials);
      // Delete the account to force a 404
      await accountRepository.deleteAccountById(accountId);

      // Query the endpoint and compare the result
      const {token} = response.body;
      await client
        .post(reqEmailVerification)
        .set('Authorization', `Bearer: ${token}`)
        .expect(404)
        .send();
    });

    it('Fails when it can not enqueue the email tasks', async () => {
      const emailQueueStub = sandbox
        .stub(tasksQueuesService.verificationEmailQueue, 'add')
        .throws('Some error');

      const newUser: NewAccountDto = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      await client.post(signup).send(newUser);

      const credentials: LoginRequestDto = {
        usernameOrEmail: newUser.username,
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
      const account = await accountRepository.createAccount(partialAccount);
      // Get the user profile related to the account
      const userProfile = accountService.convertToUserProfile(
        account,
        Permission.VERIFY_EMAIL,
      );

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

      // Try to call the endpoint again (token should be revoked)
      await client
        .patch(verifyEmail)
        .set('Authorization', `Bearer: ${verificationToken}`)
        .send()
        .expect(401);
    });

    it('Fails when the account is not found', async () => {
      // Creates a new Dummy account
      const partialAccount = givenAccount();
      const account = await accountRepository.createAccount(partialAccount);
      // Get the user profile related to the account
      const userProfile = accountService.convertToUserProfile(
        account,
        Permission.VERIFY_EMAIL,
      );

      // Generate the verification token
      const verificationToken = await customTokenService.generateToken(
        userProfile,
      );

      // Delete the account
      await accountRepository.deleteAccountById(account.id);

      // Calls the endpoint to verify the email
      const response = await client
        .patch(verifyEmail)
        .set('Authorization', `Bearer: ${verificationToken}`)
        .send();

      expect(response.statusCode).to.be.equal(404);
      expect(response.body.error.message).to.be.equal(
        'The account was not found',
      );
    });

    it('Rejects when token is not provided', async () => {
      // Creates a new Dummy account
      const partialAccount = givenAccount();
      await accountRepository.createAccount(partialAccount);

      // Calls the endpoint to verify the email
      await client.patch(verifyEmail).send().expect(401);
    });

    it('Rejects when user does not have the right permissions', async () => {
      // Creates a new Dummy account
      const partialAccount = givenAccount();
      const account = await accountRepository.createAccount(partialAccount);

      const permissions = [
        Permission.RECOVER_PASSWORD,
        Permission.REGULAR,
        Permission.REQUEST_EMAIL_VERIFICATION,
      ];

      for (const permission of permissions) {
        // Get the user profile related to the account
        const userProfile = accountService.convertToUserProfile(
          account,
          permission,
        );

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
