import {Client, expect} from '@loopback/testlab';
import {UserMsApplication} from '../../application';
import {AccountCredentialsRepository, AccountRepository} from '../../repositories';
import {NewUserResquestSchema} from '../../schemas';
import {givenClient, givenRunningApp} from '../helpers/app.helpers';
import {givenAccount, givenEmptyDatabase, givenRepositories} from '../helpers/database.helpers';

describe('e2e - Account Testing', () => {
  let app: UserMsApplication;
  let accountRepository: AccountRepository;
  let accountCredentialsRepository: AccountCredentialsRepository;
  let client: Client;

  before(async () => {
    app = await givenRunningApp();
    ({accountRepository, accountCredentialsRepository} = givenRepositories());
    client = await givenClient(app);
  });

  beforeEach(async () => {
    await givenEmptyDatabase();
  });

  after(async () => {
    await app.stop();
  });

  it.skip('Creates a new User', async () => {
    // TODO: Fix this test
    const newUser: NewUserResquestSchema = {
      username: 'jdiegopm',
      email: 'jdiegopm@livebackup.com',
      password: 'strong_password',
    };

    const expectedAccount = givenAccount({
      username: newUser.username,
      email: newUser.email,
      is_email_verified: false, // eslint-disable-line
    });

    const createdAccount = (await client.post('/sign-up')).body;
    const createdCredentials = await accountCredentialsRepository
      .findOne({where: {account_id: createdAccount.id}});

    expect(createdAccount.username).to.be.equal(expectedAccount.username);
    expect(createdAccount.email).to.be.equal(expectedAccount.email);
    expect(createdAccount.is_email_verified).to.be.equal(expectedAccount.is_email_verified);
    expect(createdCredentials).not.to.be.null();
  });
});
