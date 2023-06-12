import {Client, expect} from '@loopback/testlab';
import sinon from 'sinon';
import {UserMsApplication} from '../../application';
import {Account} from '../../models';
import {AccountRepository} from '../../repositories';
import {Credentials, NewAccount} from '../../schemas';
import {
  AccountService,
  CustomTokenService,
  Permissions,
  TasksQueuesService,
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
  let customTokenService: CustomTokenService;

  before(async () => {
    app = await givenRunningApp();
    client = await givenClient(app);
    await app.get('services.TasksQueuesService');

    ({accountRepository} = givenRepositories());
    ({accountService} = await givenServices());
    customTokenService = new CustomTokenService(
      'secret',
      '3600000',
      '3600000',
      '3600000',
    );
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

  describe('Email query creation - /account/request-email-verification Endpoint', () => {
    it('Creates the email verification request', async () => {
      const newUser: NewAccount = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      await client.post('/sign-up').send(newUser);

      const credentials: Credentials = {
        username: newUser.username,
        password: newUser.password,
      };
      const response = await client.post('/login').send(credentials);

      const {token} = response.body;
      await client
        .post('/account/request-email-verification')
        .set('Authorization', `Bearer: ${token}`)
        .expect(204)
        .send();
    });

    it('Reject when does not has request email verification permission', async () => {
      const newUser: NewAccount = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      let response = await client.post('/sign-up').send(newUser);
      const accountId = response.body.id;

      await accountRepository.updateById(accountId, {
        isEmailVerified: true,
      });

      const credentials: Credentials = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post('/login').send(credentials);

      const {token} = response.body;
      await client
        .post('/account/request-email-verification')
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

      let response = await client.post('/sign-up').send(newUser);
      const accountId = response.body.id;

      const credentials: Credentials = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post('/login').send(credentials);

      await accountRepository.updateById(accountId, {
        isEmailVerified: true,
      });

      const {token} = response.body;
      await client
        .post('/account/request-email-verification')
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
      let response = await client.post('/sign-up').send(newUser);
      const accountId = response.body.id;

      const credentials: Credentials = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post('/login').send(credentials);
      await accountRepository.deleteById(accountId);

      const {token} = response.body;
      await client
        .post('/account/request-email-verification')
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
      await client.post('/sign-up').send(newUser);

      const credentials: Credentials = {
        username: newUser.username,
        password: newUser.password,
      };
      const response = await client.post('/login').send(credentials);

      const {token} = response.body;
      await client
        .post('/account/request-email-verification')
        .set('Authorization', `Bearer: ${token}`)
        .expect(500)
        .send();

      expect(emailQueueStub.calledOnce).to.be.True();
      expect(emailQueueStub.threw()).to.be.True();
    });
  });

  describe('Verify Email - /account/verify-email Endpoint', () => {
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
        .patch('/account/verify-email')
        .set('Authorization', `Bearer: ${verificationToken}`)
        .send()
        .expect(200);

      // Check the response
      const updatedAccount = response.body as Account;
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
        .patch('/account/verify-email')
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
      await client.patch('/account/verify-email').send().expect(401);
    });

    it('Rejects when user does not have the right permissions', async () => {
      // Creates a new Dummy account
      const partialAccount = givenAccount();
      const account = await accountRepository.create(partialAccount);
      // Get the user profile related to the account
      const userProfile = accountService.convertToUserProfile(account, [
        Permissions.RECOVER_PASSWORD,
      ]);

      // Generate the verification token
      const verificationToken = await customTokenService.generateToken(
        userProfile,
      );

      // Calls the endpoint to verify the email
      await client
        .patch('/account/verify-email')
        .set('Authorization', `Bearer: ${verificationToken}`)
        .send()
        .expect(403);
    });
  });
});
