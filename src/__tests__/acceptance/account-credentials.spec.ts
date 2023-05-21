import {Client, expect} from '@loopback/testlab';
import sinon from 'sinon';
import {UserMsApplication} from '../../application';
import {Account} from '../../models';
import {
  AccountCredentialsService,
  AccountService,
  TasksQueuesService,
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
  // Account and credentials
  let account: Account;
  // Paths
  const reqPassRecovery = '/credentials/request-password-recovery';

  before(async () => {
    app = await givenRunningApp();
    client = await givenClient(app);
    ({accountService, accountCredentialsService} = await givenServices());
  });

  beforeEach(async () => {
    await givenEmptyDatabase();

    // Create the testing account in db
    const dummyAccount = givenAccount({isEmailVerified: true});
    account = await accountService.create(dummyAccount);
    // Create the testing credentials in db
    const dummyCredentials = givenAccountCredentials({accountId: account.id});
    dummyCredentials.password = await accountCredentialsService.hashPassword(
      dummyCredentials.password,
    );
    await accountCredentialsService.create(dummyCredentials);
  });

  after(async () => {
    await app.stop();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Request recovery password - ${reqPassRecovery} Endpoint`, () => {
    it('Cretes the task to send the recovery password email', async () => {
      const recoveryRequest = {
        email: account.email,
      };

      await client.post(reqPassRecovery).expect(204).send(recoveryRequest);
    });

    it('Does not found the email', async () => {
      const recoveryRequest = {
        email: `other${account.email}`,
      };

      const response = await client.post(reqPassRecovery).send(recoveryRequest);
      expect(response.statusCode).to.be.equal(404);
      expect(response.body.error.message).to.be.equal(
        'There is not an account registered with the given email',
      );
    });

    it('Fails to enqueue the email sending tasks', async () => {
      const addJobStub = sandbox
        .stub(TasksQueuesService.recoveryPasswordQueue, 'add')
        .throws('Failed to add a Job');

      const recoveryRequest = {
        email: account.email,
      };

      const response = await client.post(reqPassRecovery).send(recoveryRequest);
      expect(response.statusCode).to.be.equal(500);
      expect(addJobStub.calledOnce).to.be.true();
      expect(addJobStub.threw()).to.be.true();
    });
  });
});
