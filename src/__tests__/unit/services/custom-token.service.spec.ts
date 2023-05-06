import {securityId} from '@loopback/security';
import {expect} from '@loopback/testlab';
import {
  CustomTokenService,
  ExtendedUserProfile,
  Permissions,
} from '../../../services';
import {givenExtendedUserProfile} from '../../helpers/services.helpers';

describe('Unit Testing - CustomToken Service', () => {
  let customTokenService: CustomTokenService;
  const expiredTokenMessage = 'Error decoding the token: jwt expired';

  beforeEach(() => {
    customTokenService = new CustomTokenService(
      'secret',
      '3600000',
      '1800000',
      '300000',
    );
  });

  it('Fails to generate a token when no array permissions is given', async () => {
    const userProfile = givenExtendedUserProfile({
      permissions: undefined,
    });

    let expectedError;
    try {
      await customTokenService.generateToken(userProfile);
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
      await customTokenService.generateToken(userProfile);
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
      await customTokenService.generateToken(userProfile);
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
    const token = await customTokenService.generateToken(userProfile);
    expect(token).not.to.be.null();
    expect(token.length).to.be.greaterThan(0);
  });

  it('Fails to generate a token when combination is not allowed', async () => {
    const userProfile = givenExtendedUserProfile({
      permissions: [Permissions.REGULAR, Permissions.RECOVER_PASSWORD],
    });

    let expectedError;
    try {
      await customTokenService.generateToken(userProfile);
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

    const token = await customTokenService.generateToken(userProfile);
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

    const token = await customTokenService.generateToken(
      givenExtendedUserProfile(partialUserProfile),
    );
    const userProfile = await customTokenService.verifyToken(token);

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
      await customTokenService.verifyToken('');
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.statusCode).to.be.equal(401);
    expect(expectedError.message).not.to.be.equal(expiredTokenMessage);
  });

  it('Throw a 401 error when token has expired', async () => {
    let expectedError;
    customTokenService = new CustomTokenService('secret', '1', '1', '1');
    const userProfile = givenExtendedUserProfile();
    const token = await customTokenService.generateToken(userProfile);
    expect(token).not.to.be.Null();
    expect(token.length).to.be.greaterThan(0);

    try {
      await customTokenService.verifyToken(token);
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.statusCode).to.be.equal(401);
    expect(expectedError.message).to.be.equal(expiredTokenMessage);
  });

  it('Generates a regular token', async () => {
    let expectedError;
    customTokenService = new CustomTokenService(
      'secret',
      '1',
      '1800000',
      '300000',
    );
    const userProfile = givenExtendedUserProfile({
      permissions: [Permissions.REGULAR],
    });
    const token = await customTokenService.generateToken(userProfile);
    expect(token).not.to.be.Null();
    expect(token.length).to.be.greaterThan(0);

    try {
      await customTokenService.verifyToken(token);
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.statusCode).to.be.equal(401);
    expect(expectedError.message).to.be.equal(expiredTokenMessage);
  });

  it('Generates a request email verification token', async () => {
    let expectedError;
    customTokenService = new CustomTokenService(
      'secret',
      '1',
      '1800000',
      '300000',
    );
    const userProfile = givenExtendedUserProfile({
      permissions: [Permissions.REQUEST_EMAIL_VERIFICATION],
    });
    const token = await customTokenService.generateToken(userProfile);
    expect(token).not.to.be.Null();
    expect(token.length).to.be.greaterThan(0);

    try {
      await customTokenService.verifyToken(token);
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.statusCode).to.be.equal(401);
    expect(expectedError.message).to.be.equal(expiredTokenMessage);
  });

  it('Generates a verify email token', async () => {
    let expectedError;
    customTokenService = new CustomTokenService(
      'secret',
      '3600000',
      '1',
      '300000',
    );
    const userProfile = givenExtendedUserProfile({
      permissions: [Permissions.VERIFY_EMAIL],
    });
    const token = await customTokenService.generateToken(userProfile);
    expect(token).not.to.be.Null();
    expect(token.length).to.be.greaterThan(0);

    try {
      await customTokenService.verifyToken(token);
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.statusCode).to.be.equal(401);
    expect(expectedError.message).to.be.equal(expiredTokenMessage);
  });

  it('Generates a recover password token', async () => {
    let expectedError;
    customTokenService = new CustomTokenService(
      'secret',
      '3600000',
      '1800000',
      '1',
    );
    const userProfile = givenExtendedUserProfile({
      permissions: [Permissions.RECOVER_PASSWORD],
    });
    const token = await customTokenService.generateToken(userProfile);
    expect(token).not.to.be.Null();
    expect(token.length).to.be.greaterThan(0);

    try {
      await customTokenService.verifyToken(token);
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).not.to.be.Undefined();
    expect(expectedError.statusCode).to.be.equal(401);
    expect(expectedError.message).to.be.equal(expiredTokenMessage);
  });
});
