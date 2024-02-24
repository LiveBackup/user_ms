import {HttpErrors} from '@loopback/rest';
import {Client} from '@loopback/testlab';
import sinon from 'sinon';
import {UserMsApplication} from '../../../application';
import {AccountController, AuthController} from '../../../controllers';
import {Account, Permissions} from '../../../models';
import {
  AccountService,
  TokenService,
  TokenServiceBindings,
} from '../../../services';
import {givenClient, givenRunningApp} from '../../helpers/app.helpers';
import {givenAccount, givenEmptyDatabase} from '../../helpers/database.helpers';
import {givenServices} from '../../helpers/services.helpers';

describe('e2e - Token interceptor', () => {
  // Sinon sandbox
  const sandbox = sinon.createSandbox();
  // And and client utilities for testing
  let app: UserMsApplication;
  let client: Client;
  // Services
  let accountService: AccountService;
  let tokenService: TokenService;
  // Account and credentials
  let defaultAccount: Account;

  before(async () => {
    app = await givenRunningApp();
    client = await givenClient(app);
    ({accountService} = await givenServices());
    tokenService = await app.get(TokenServiceBindings.TOKEN_SERVICE);
  });

  beforeEach(async () => {
    await givenEmptyDatabase();

    // Create the testing account in db
    const mockAccount = givenAccount({isEmailVerified: true});
    defaultAccount = await accountService.create(mockAccount);
  });

  after(async () => {
    await app.stop();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Does no revoke a multi-usage token', async () => {
    // Define the endpoint to use
    const endpoint = '/auth/who-am-i';
    // Generate a user profile with regular permission
    const userProfile = accountService.convertToUserProfile(
      defaultAccount,
      Permissions.REGULAR,
    );
    // Generates the token
    const token = await tokenService.generateToken(userProfile);

    // Mock the whoAmI method to always work
    sandbox
      .stub(AuthController.prototype, 'whoAmI')
      .returns(Promise.resolve(defaultAccount));

    // Call the whoAMI EP without token and expect to fail
    await client.get(endpoint).expect(401);

    // Call the EP again with token and expect to work
    await client
      .get(endpoint)
      .set('Authorization', `Bearer: ${token}`)
      .expect(200);

    // Call the EP again with token and expect to work again
    await client
      .get(endpoint)
      .set('Authorization', `Bearer: ${token}`)
      .expect(200);
  });

  it('Revokes a one-usage token', async () => {
    // Define the endpoint to use
    const endpoint = '/account/verify-email';
    // Generate a user profile with regular permission
    const userProfile = accountService.convertToUserProfile(
      defaultAccount,
      Permissions.VERIFY_EMAIL,
    );
    // Generates the token
    const token = await tokenService.generateToken(userProfile);

    // Mock the verifyEmail method to always work
    sandbox
      .stub(AccountController.prototype, 'verifyEmail')
      .returns(Promise.resolve(defaultAccount));

    // Call the verifyEmail EP without token and expect to fail
    await client.patch(endpoint).expect(401);

    // Call the EP again with token and expect to work
    await client
      .patch(endpoint)
      .set('Authorization', `Bearer: ${token}`)
      .expect(200);

    // Call the EP again with token and expect fail
    await client
      .patch(endpoint)
      .set('Authorization', `Bearer: ${token}`)
      .expect(401);
  });

  it('Does not revoke a one-usage token if query fails', async () => {
    // Define the endpoint to use
    const endpoint = '/account/verify-email';
    // Generate a user profile with regular permission
    const userProfile = accountService.convertToUserProfile(
      defaultAccount,
      Permissions.VERIFY_EMAIL,
    );
    // Generates the token
    const token = await tokenService.generateToken(userProfile);

    // Mock the verifyEmail method to fail once and work once
    sandbox
      .stub(AccountController.prototype, 'verifyEmail')
      .onFirstCall()
      .throws(new HttpErrors[400]())
      .onSecondCall()
      .returns(Promise.resolve(defaultAccount));

    // Call the verifyEmail EP without token and expect to fail
    await client.patch(endpoint).expect(401);

    // Call the EP again with token and expect to fails
    // The token should not be revoked
    await client
      .patch(endpoint)
      .set('Authorization', `Bearer: ${token}`)
      .expect(400);

    // Call the EP again with token and expect work
    await client
      .patch(endpoint)
      .set('Authorization', `Bearer: ${token}`)
      .expect(200);
  });
});
