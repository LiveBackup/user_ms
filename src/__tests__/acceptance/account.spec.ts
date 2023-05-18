import {Client, expect} from '@loopback/testlab';
import sinon from 'sinon';
import {UserMsApplication} from '../../application';
import {AccountRepository} from '../../repositories';
import {Credentials, NewAccount} from '../../schemas';
import {TasksQueuesService} from '../../services';
import {givenClient, givenRunningApp} from '../helpers/app.helpers';
import {
  givenEmptyDatabase,
  givenRepositories,
} from '../helpers/database.helpers';

describe('e2e - Account Controller', () => {
  const sandbox = sinon.createSandbox();
  let app: UserMsApplication;
  let accountRepository: AccountRepository;
  let client: Client;

  before(async () => {
    ({accountRepository} = givenRepositories());
    app = await givenRunningApp();
    client = await givenClient(app);
    await app.get('services.TasksQueuesService');
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

  describe('Email query creation - /verify-email Endpoint', () => {
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
});
