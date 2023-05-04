import {Client, expect} from '@loopback/testlab';
import sinon from 'sinon';
import {UserMsApplication} from '../../application';
import {Account} from '../../models';
import {
  AccountCredentialsRepository,
  AccountRepository,
} from '../../repositories';
import {
  LoginResquestSchemaObject,
  NewUserResquestSchemaObject,
} from '../../schemas';
import {givenClient, givenRunningApp} from '../helpers/app.helpers';
import {
  givenAccount,
  givenEmptyDatabase,
  givenRepositories,
} from '../helpers/database.helpers';

describe('e2e - Account Testing', () => {
  const sandbox = sinon.createSandbox();
  let app: UserMsApplication;
  let accountRepository: AccountRepository;
  let accountCredentialsRepository: AccountCredentialsRepository;
  let client: Client;

  before(async () => {
    ({accountRepository, accountCredentialsRepository} = givenRepositories());
    app = await givenRunningApp();
    client = await givenClient(app);
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

  describe('User creation - /sign-up Endpoint', () => {
    it('Creates a new User', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      /* eslint-disable @typescript-eslint/naming-convention */
      const expectedAccount = givenAccount({
        username: newUser.username,
        email: newUser.email,
        is_email_verified: false,
      });
      /* eslint-enable @typescript-eslint/naming-convention */

      const response = await client.post('/sign-up').send(newUser);
      expect(response.statusCode).to.be.equal(
        201,
        response.body.error?.message,
      );

      const createdAccount = response.body;
      expect(createdAccount.username).to.be.equal(expectedAccount.username);
      expect(createdAccount.email).to.be.equal(expectedAccount.email);
      expect(createdAccount.is_email_verified).to.be.equal(
        expectedAccount.is_email_verified,
      );
      expect(
        new Date(createdAccount.registered_at).valueOf(),
      ).to.be.greaterThan(expectedAccount.registered_at.valueOf());
      expect(new Date(createdAccount.registered_at).valueOf()).to.be.lessThan(
        new Date().valueOf(),
      );

      /* eslint-disable @typescript-eslint/naming-convention */
      const createdCredentials = await accountCredentialsRepository.findOne({
        where: {account_id: createdAccount.id},
      });
      /* eslint-enable @typescript-eslint/naming-convention */
      expect(createdCredentials).not.to.be.null();
    });

    it('Reject when a user already exists with a given email', async () => {
      const user = givenAccount({email: 'jdiegopm12@livebackup.com'});
      await accountRepository.create(user);

      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm12',
        email: 'jdiegopm12@livebackup.com',
        password: 'strong_password',
      };

      const response = await client.post('/sign-up').send(newUser);
      expect(response.status).to.be.equal(400);
      expect(response.body.error.message).to.be.equal(
        'There already exists an Account with the given email',
      );
    });

    it('Reject when a user already exists with a given username', async () => {
      const user = givenAccount({username: 'jdiegopm12'});
      await accountRepository.create(user);

      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm12',
        email: 'jdiegopm12@livebackup.com',
        password: 'strong_password',
      };

      const response = await client.post('/sign-up').send(newUser);
      expect(response.status).to.be.equal(400);
      expect(response.body.error.message).to.be.equal(
        'There already exists an Account with the given username',
      );
    });
  });

  describe('User login - /login Endpoint', () => {
    it('Get a valid token', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      const registerResponse = await client.post('/sign-up').send(newUser);
      await accountRepository.updateById(
        registerResponse.body.id,
        {is_email_verified: true}, // eslint-disable-line
      );

      const loginRequest: LoginResquestSchemaObject = {
        username: newUser.username,
        password: newUser.password,
      };

      const response = await client.post('/login').send(loginRequest);
      expect(response.statusCode).to.be.equal(
        200,
        response.body.error?.message,
      );

      const token = response.body;
      expect(token).not.to.be.null();
      expect(token.token).not.to.be.empty();
    });

    it('Reject the query when the account credentials are not found', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      const registerResponse = await client.post('/sign-up').send(newUser);
      await accountRepository.updateById(
        registerResponse.body.id,
        {is_email_verified: true}, // eslint-disable-line
      );

      const createdAccount = await accountRepository.findOne({
        where: {
          username: newUser.username,
        },
      });
      const accountCredentialsCreated =
        await accountCredentialsRepository.findOne({
          where: {
            account_id: createdAccount?.id, // eslint-disable-line
          },
        });
      await accountCredentialsRepository.deleteById(
        accountCredentialsCreated?.id ?? '',
      );

      const loginRequest: LoginResquestSchemaObject = {
        username: newUser.username,
        password: newUser.password,
      };

      await client.post('/login').expect(404).send(loginRequest);
    });

    it('Reject the query when user not found', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      await client.post('/sign-up').send(newUser);

      const loginRequest: LoginResquestSchemaObject = {
        username: 'newUser.username',
        password: 'newUser.password',
      };

      const response = await client.post('/login').send(loginRequest);
      expect(response.statusCode).to.be.equal(400);
      expect(response.body.error.message).to.be.equal(
        'Incorrect username or password',
      );
    });

    it('Reject the query when the password is wrong', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      const registerResponse = await client.post('/sign-up').send(newUser);
      await accountRepository.updateById(
        registerResponse.body.id,
        {is_email_verified: true}, // eslint-disable-line
      );

      const loginRequest: LoginResquestSchemaObject = {
        username: newUser.username,
        password: 'weak_password',
      };

      const response = await client.post('/login').send(loginRequest);
      expect(response.statusCode).to.be.equal(400);
      expect(response.body.error.message).to.be.equal(
        'Incorrect username or password',
      );
    });

    it('Get the token when user has not verified the email', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      await client.post('/sign-up').send(newUser);

      const loginRequest: LoginResquestSchemaObject = {
        username: newUser.username,
        password: newUser.password,
      };

      const response = await client.post('/login').send(loginRequest);
      expect(response.statusCode).to.be.equal(200);
      expect(response.body.token).not.to.be.Null();
    });
  });

  describe('User token validation - /who-am-i Endpoint', () => {
    it('Get the account info by providing a valid token', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      let response = await client.post('/sign-up').send(newUser);
      /* eslint-disable @typescript-eslint/naming-convention */
      await accountRepository.updateById(response.body.id, {
        is_email_verified: true,
      });
      /* eslint-enable @typescript-eslint/naming-convention */

      const credentials: LoginResquestSchemaObject = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post('/login').send(credentials);

      const {token} = response.body;
      response = await client
        .get('/who-am-i')
        .set('Authorization', `Bearer: ${token}`)
        .send();
      expect(response.statusCode).to.be.equal(
        200,
        response.body.error?.message,
      );
      const account = response.body as Account;

      expect(account.id).not.to.be.empty();
      expect(account.email).to.be.equal(newUser.email);
      expect(account.username).to.be.equal(newUser.username);
    });

    it('Does not find the account for the provided token', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      let response = await client.post('/sign-up').send(newUser);
      const accountId = response.body.id;
      /* eslint-disable @typescript-eslint/naming-convention */
      await accountRepository.updateById(accountId, {is_email_verified: true});
      /* eslint-enable @typescript-eslint/naming-convention */

      const credentials: LoginResquestSchemaObject = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post('/login').send(credentials);
      await accountRepository.deleteById(accountId);

      const {token} = response.body;
      response = await client
        .get('/who-am-i')
        .set('Authorization', `Bearer: ${token}`)
        .send();
      expect(response.statusCode).to.be.equal(
        404,
        response.body.error?.message,
      );
    });

    it('Fails to get account info by providing a non-valid token', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      await client.post('/sign-up').send(newUser);

      const token = 'non-valid-token';
      const response = await client
        .get('/who-am-i')
        .set('Authorization', `Bearer: ${token}`)
        .send();
      expect(response.statusCode).to.be.equal(401);
    });
  });

  describe('Email query creation - /verify-email Endpoint', () => {
    it('Creates the email verification request', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      await client.post('/sign-up').send(newUser);

      const credentials: LoginResquestSchemaObject = {
        username: newUser.username,
        password: newUser.password,
      };
      const response = await client.post('/login').send(credentials);

      const {token} = response.body;
      await client
        .post('/verify-email')
        .set('Authorization', `Bearer: ${token}`)
        .expect(204)
        .send();
    });

    it('Reject when the permission does not match', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      let response = await client.post('/sign-up').send(newUser);
      const accountId = response.body.id;
      /* eslint-disable @typescript-eslint/naming-convention */
      await accountRepository.updateById(accountId, {
        is_email_verified: true,
      });
      /* eslint-enable @typescript-eslint/naming-convention */

      const credentials: LoginResquestSchemaObject = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post('/login').send(credentials);

      const {token} = response.body;
      await client
        .post('/verify-email')
        .set('Authorization', `Bearer: ${token}`)
        .expect(403)
        .send();
    });

    it('Reject when the user email it has already been verified', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };

      let response = await client.post('/sign-up').send(newUser);
      const accountId = response.body.id;

      const credentials: LoginResquestSchemaObject = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post('/login').send(credentials);
      /* eslint-disable @typescript-eslint/naming-convention */
      await accountRepository.updateById(accountId, {
        is_email_verified: true,
      });
      /* eslint-enable @typescript-eslint/naming-convention */

      const {token} = response.body;
      await client
        .post('/verify-email')
        .set('Authorization', `Bearer: ${token}`)
        .expect(400)
        .send();
    });

    it('Does not find the account to verify the email', async () => {
      const newUser: NewUserResquestSchemaObject = {
        username: 'jdiegopm',
        email: 'jdiegopm@livebackup.com',
        password: 'strong_password',
      };
      let response = await client.post('/sign-up').send(newUser);
      const accountId = response.body.id;

      const credentials: LoginResquestSchemaObject = {
        username: newUser.username,
        password: newUser.password,
      };
      response = await client.post('/login').send(credentials);
      await accountRepository.deleteById(accountId);

      const {token} = response.body;
      await client
        .post('/verify-email')
        .set('Authorization', `Bearer: ${token}`)
        .expect(404)
        .send();
    });
  });
});
