import {Client, expect} from '@loopback/testlab';
import {UserMsApplication} from '../../application';
import {
  AccountCredentialsRepository,
  AccountRepository,
} from '../../repositories';
import {NewUserResquestSchemaObject} from '../../schemas';
import {givenClient, givenRunningApp} from '../helpers/app.helpers';
import {
  givenAccount,
  givenEmptyDatabase,
  givenRepositories,
} from '../helpers/database.helpers';

describe('e2e - Account Testing', () => {
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
});
