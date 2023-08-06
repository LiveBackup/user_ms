import {securityId} from '@loopback/security';
import {expect} from '@loopback/testlab';
import {Account, Permissions} from '../../../models';
import {AccountRepository, TokenRepository} from '../../../repositories';
import {AccountService, TokenService} from '../../../services';
import {
  givenAccount,
  givenEmptyDatabase,
  givenRepositories,
} from '../../helpers/database.helpers';
import {givenExtendedUserProfile} from '../../helpers/services.helpers';

describe('Unit Testing - Token Service', () => {
  // App repositories
  let accountRepository: AccountRepository;
  let tokenRepository: TokenRepository;
  // App services
  let tokenService: TokenService;
  let accountService: AccountService;
  // Utils
  const account: Account = givenAccount();
  // Constants
  const expiredTokenMessage = 'Error verifying the token: Token has expired';

  before(() => {
    ({accountRepository, tokenRepository} = givenRepositories());
    accountService = new AccountService(accountRepository);
  });

  beforeEach(async () => {
    await givenEmptyDatabase();
    await accountRepository.create(account);

    tokenService = new TokenService(
      tokenRepository,
      'secret',
      3600000,
      1800000,
      300000,
    );
  });

  it('Fails to generate a token when no array permissions is given', async () => {
    const userProfile = givenExtendedUserProfile({permissions: undefined});

    let expectedError;
    try {
      await tokenService.generateToken(userProfile);
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.message).to.be.equal(
      'Permissions array must be provided',
    );
  });

  it('Fails to generate a token when array permissions is empty', async () => {
    const userProfile = givenExtendedUserProfile({permissions: []});

    let expectedError;
    try {
      await tokenService.generateToken(userProfile);
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.message).to.be.equal(
      'Permissions array must contain at least 1 permission',
    );
  });

  it('Fails to generate a token when more than 2 permissions were provided', async () => {
    const userProfile = givenExtendedUserProfile({
      permissions: [
        Permissions.REGULAR,
        Permissions.RECOVER_PASSWORD,
        Permissions.VERIFY_EMAIL,
      ],
    });

    let expectedError;
    try {
      await tokenService.generateToken(userProfile);
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.message).to.be.equal(
      'Permissions array can not contain at more than 2 permissions',
    );
  });

  it('Generates a token with a single permission', async () => {
    const userProfile = givenExtendedUserProfile();
    const token = await tokenService.generateToken(userProfile);
    expect(token).not.to.be.null();
    expect(token.length).to.be.greaterThan(0);
  });

  it('Fails to generate a token when combination is not allowed', async () => {
    const userProfile = givenExtendedUserProfile({
      permissions: [Permissions.REGULAR, Permissions.RECOVER_PASSWORD],
    });

    let expectedError;
    try {
      await tokenService.generateToken(userProfile);
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.message).to.be.equal(
      'Combination of permissions are not allowed: REGULAR,RECOVER_PASSWORD',
    );
  });

  it('Generate a token when combination is allowed', async () => {
    const userProfile = givenExtendedUserProfile({
      permissions: [
        Permissions.REGULAR,
        Permissions.REQUEST_EMAIL_VERIFICATION,
      ],
    });

    const token = await tokenService.generateToken(userProfile);
    expect(token).not.to.be.null();
    expect(token.length).to.be.greaterThan(0);
  });

  it('Verify a token', async () => {
    const userProfile = accountService.convertToUserProfile(account, [
      Permissions.REGULAR,
    ]);

    const token = await tokenService.generateToken(userProfile);
    const resultUserProfile = await tokenService.verifyToken(token);

    expect(resultUserProfile).not.to.be.null();
    expect(resultUserProfile[securityId]).to.be.equal(userProfile[securityId]);
    expect(resultUserProfile.permissions).to.containDeep(
      userProfile.permissions,
    );
  });

  it('Throw a 401 error when no token is provided', async () => {
    let expectedError;
    try {
      await tokenService.verifyToken('');
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.statusCode).to.be.equal(401);
    const noTokenError = 'Error verifying the Token: No token was provided';
    expect(expectedError.message).to.be.equal(noTokenError);
  });

  it('Throw a 401 error when token has expired', async () => {
    let expectedError;
    tokenService = new TokenService(tokenRepository, 'secret', 0, 0, 0);
    const userProfile = givenExtendedUserProfile();
    const token = await tokenService.generateToken(userProfile);
    expect(token).not.to.be.Null();
    expect(token.length).to.be.greaterThan(0);

    try {
      await tokenService.verifyToken(token);
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.statusCode).to.be.equal(401);
    expect(expectedError.message).to.be.equal(expiredTokenMessage);
  });

  it('Generates a regular token', async () => {
    const permissions = [Permissions.REGULAR];
    const userProfile = accountService.convertToUserProfile(
      account,
      permissions,
    );

    // Generate the token
    const token = await tokenService.generateToken(userProfile);
    expect(token).not.to.be.Null();
    expect(token.length).to.be.greaterThan(0);

    // Get the token result
    const resultProfle = await tokenService.verifyToken(token);

    expect(resultProfle).not.to.be.Undefined();
    expect(resultProfle.permissions).to.be.Array();
    expect(resultProfle.permissions).to.be.deepEqual(permissions);
  });

  it('Generates a request email verification token', async () => {
    const permissions = [Permissions.REQUEST_EMAIL_VERIFICATION];
    const userProfile = accountService.convertToUserProfile(
      account,
      permissions,
    );

    // Generate the token
    const token = await tokenService.generateToken(userProfile);
    expect(token).not.to.be.Null();
    expect(token.length).to.be.greaterThan(0);

    // Get the token result
    const resultProfle = await tokenService.verifyToken(token);

    expect(resultProfle).not.to.be.Undefined();
    expect(resultProfle.permissions).to.be.Array();
    expect(resultProfle.permissions).to.be.deepEqual(permissions);
  });

  it('Generates a verify email token', async () => {
    const permissions = [Permissions.VERIFY_EMAIL];
    const userProfile = accountService.convertToUserProfile(
      account,
      permissions,
    );

    // Generate the token
    const token = await tokenService.generateToken(userProfile);
    expect(token).not.to.be.Null();
    expect(token.length).to.be.greaterThan(0);

    // Get the token result
    const resultProfle = await tokenService.verifyToken(token);

    expect(resultProfle).not.to.be.Undefined();
    expect(resultProfle.permissions).to.be.Array();
    expect(resultProfle.permissions).to.be.deepEqual(permissions);
  });

  it('Generates a recover password token', async () => {
    const permissions = [Permissions.RECOVER_PASSWORD];
    const userProfile = accountService.convertToUserProfile(
      account,
      permissions,
    );

    // Generate the token
    const token = await tokenService.generateToken(userProfile);
    expect(token).not.to.be.Null();
    expect(token.length).to.be.greaterThan(0);

    // Get the token result
    const resultProfle = await tokenService.verifyToken(token);

    expect(resultProfle).not.to.be.Undefined();
    expect(resultProfle.permissions).to.be.Array();
    expect(resultProfle.permissions).to.be.deepEqual(permissions);
  });
});
