import {securityId} from '@loopback/security';
import {expect} from '@loopback/testlab';
import {TokenRepository} from '../../../repositories';
import {
  ExtendedUserProfile,
  Permissions,
  TokenService,
} from '../../../services';
import {givenRepositories} from '../../helpers/database.helpers';
import {givenExtendedUserProfile} from '../../helpers/services.helpers';

describe('Unit Testing - Token Service', () => {
  // App repositories
  let tokenRepository: TokenRepository;
  // App services
  let tokenService: TokenService;
  // Constants
  const expiredTokenMessage = 'Error decoding the token: jwt expired';

  before(() => {
    ({tokenRepository} = givenRepositories());
  });

  beforeEach(() => {
    tokenService = new TokenService(
      tokenRepository,
      'secret',
      3600000,
      1800000,
      300000,
    );
  });

  it('Fails to generate a token when no array permissions is given', async () => {
    const userProfile = givenExtendedUserProfile({
      permissions: undefined,
    });

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
    const userProfile = givenExtendedUserProfile({
      permissions: [],
    });

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
    const partialUserProfile: Partial<ExtendedUserProfile> = {
      [securityId]: '1',
      email: 'testing@email.com',
      username: 'testing',
      permissions: [Permissions.REGULAR],
    };

    const token = await tokenService.generateToken(
      givenExtendedUserProfile(partialUserProfile),
    );
    const userProfile = await tokenService.verifyToken(token);

    expect(userProfile).not.to.be.null();
    expect(userProfile[securityId]).to.be.equal(partialUserProfile[securityId]);
    expect(userProfile.email).to.be.equal(partialUserProfile.email);
    expect(userProfile.username).to.be.equal(partialUserProfile.username);
    expect(userProfile.permissions).to.containDeep(
      partialUserProfile.permissions,
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
    expect(expectedError.message).not.to.be.equal(expiredTokenMessage);
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
    let expectedError;
    tokenService = new TokenService(
      tokenRepository,
      'secret',
      0,
      1800000,
      300000,
    );
    const userProfile = givenExtendedUserProfile({
      permissions: [Permissions.REGULAR],
    });
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

  it('Generates a request email verification token', async () => {
    let expectedError;
    tokenService = new TokenService(tokenRepository, 'secret', 0, 1800, 300);
    const userProfile = givenExtendedUserProfile({
      permissions: [Permissions.REQUEST_EMAIL_VERIFICATION],
    });
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

  it('Generates a verify email token', async () => {
    let expectedError;
    tokenService = new TokenService(tokenRepository, 'secret', 3600, 0, 300);
    const userProfile = givenExtendedUserProfile({
      permissions: [Permissions.VERIFY_EMAIL],
    });
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

  it('Generates a recover password token', async () => {
    let expectedError;
    tokenService = new TokenService(tokenRepository, 'secret', 3600, 1800, 0);
    const userProfile = givenExtendedUserProfile({
      permissions: [Permissions.RECOVER_PASSWORD],
    });
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
});
