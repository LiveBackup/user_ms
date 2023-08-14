import {securityId} from '@loopback/security';
import {expect} from '@loopback/testlab';
import {Account, Permissions} from '../../../models';
import {AccountRepository, TokenRepository} from '../../../repositories';
import {AccountService, TokenService} from '../../../services';
import {
  givenAccount,
  givenEmptyDatabase,
  givenRepositories,
  givenToken,
} from '../../helpers/database.helpers';
import {givenRequestUserProfile} from '../../helpers/services.helpers';

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

  describe('Get token parts', () => {
    it('Gets the id and secret from a token', () => {
      // Generate a dummy token value
      const expectedId = '1-2-3-4-5';
      const expectedSecret = '6-7-8-9-0';
      const token = `${expectedId}-${expectedSecret}`;

      // Split the dummt token into its parts
      const [id, secret] = tokenService.getTokenParts(token);

      // Check the results
      expect(id).to.be.equal(expectedId);
      expect(secret).to.be.equal(expectedSecret);
    });

    it('Throws an error when less than 10 parts are provided', () => {
      let error;
      // Call the error and expected to catch an error
      try {
        tokenService.getTokenParts('1-2-3-4-5-6-7-8-9');
      } catch (err) {
        error = err;
      }

      expect(error).not.to.be.Undefined();
      expect(error.message).to.be.equal(
        'Error verifying the token: Invalid Token',
      );
    });

    it('Throws an error when more than 10 parts are provided', () => {
      let error;
      // Call the error and expected to catch an error
      try {
        tokenService.getTokenParts('1-2-3-4-5-6-7-8-9-10-11');
      } catch (err) {
        error = err;
      }

      expect(error).not.to.be.Undefined();
      expect(error.message).to.be.equal(
        'Error verifying the token: Invalid Token',
      );
    });
  });

  describe('Token generation and validations', () => {
    it('Fails to generate a token when no permission is given', async () => {
      const userProfile = givenRequestUserProfile({permission: undefined});

      let expectedError;
      try {
        await tokenService.generateToken(userProfile);
      } catch (error) {
        expectedError = error;
      }

      expect(expectedError).not.to.be.Undefined();
      expect(expectedError.message).to.be.equal(
        'User permission must be provided',
      );
    });

    it('Generates a token with a single permission', async () => {
      const userProfile = givenRequestUserProfile();
      const token = await tokenService.generateToken(userProfile);
      expect(token).not.to.be.null();
      expect(token.length).to.be.greaterThan(0);
    });
  });

  describe('Token verification', () => {
    it('Verify a token', async () => {
      const requestUserProfile = accountService.convertToUserProfile(
        account,
        Permissions.REGULAR,
      );

      const token = await tokenService.generateToken(requestUserProfile);
      const extendedUserProfile = await tokenService.verifyToken(token);

      expect(extendedUserProfile).not.to.be.null();
      expect(extendedUserProfile[securityId]).to.be.equal(
        requestUserProfile[securityId],
      );
      expect(extendedUserProfile.permissions).to.containDeep([
        requestUserProfile.permission,
      ]);
    });

    it('Throws a 401 error when no token is provided', async () => {
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

    it('Throws a 401 error when no full token is provided', async () => {
      let expectedError;
      try {
        await tokenService.verifyToken('part1-part2-part3-part4-part5');
      } catch (error) {
        expectedError = error;
      }

      expect(expectedError).not.to.be.Undefined();
      expect(expectedError.statusCode).to.be.equal(401);
      const noTokenError = 'Error verifying the token: Invalid Token';
      expect(expectedError.message).to.be.equal(noTokenError);
    });

    it('Throws a 401 error when token is not found', async () => {
      // Create a valid token in db
      const tokenObject = givenToken({id: '1-2-3-4-56'});
      await tokenRepository.create(tokenObject);

      // Call the function with a invalid id token
      let expectedError;
      try {
        await tokenService.verifyToken('1-2-3-4-55-6-7-8-9-0');
      } catch (error) {
        expectedError = error;
      }

      // Check the result
      expect(expectedError).not.to.be.Undefined();
      expect(expectedError.statusCode).to.be.equal(401);
      const noTokenError = 'Error verifying the token: Invalid Token';
      expect(expectedError.message).to.be.equal(noTokenError);
    });

    it('Throws a 401 error when token secret does not match', async () => {
      // Create a valid token in db
      const tokenObject = givenToken();
      await tokenRepository.create(tokenObject);

      // Call the function with a invalid id token
      let expectedError;
      try {
        await tokenService.verifyToken('1-2-3-4-5-6-7-8-9-00');
      } catch (error) {
        expectedError = error;
      }

      // Check the result
      expect(expectedError).not.to.be.Undefined();
      expect(expectedError.statusCode).to.be.equal(401);
      const noTokenError = 'Error verifying the token: Invalid Token';
      expect(expectedError.message).to.be.equal(noTokenError);
    });

    it('Throws a 401 error when token has expired', async () => {
      let expectedError;
      tokenService = new TokenService(tokenRepository, 'secret', 0, 0, 0);
      const userProfile = givenRequestUserProfile();
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

    it('Validates a regular token', async () => {
      const permission = Permissions.REGULAR;
      const userProfile = accountService.convertToUserProfile(
        account,
        permission,
      );

      // Generate the token
      const token = await tokenService.generateToken(userProfile);
      expect(token).not.to.be.Null();
      expect(token.length).to.be.greaterThan(0);

      // Get the token result
      const resultProfle = await tokenService.verifyToken(token);

      expect(resultProfle).not.to.be.Undefined();
      expect(resultProfle.permissions).to.be.Array();
      expect(resultProfle.permissions).to.be.deepEqual([permission]);

      // Verify the token has not been deleted
      let error;
      try {
        await tokenService.verifyToken(token);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.undefined();
    });

    it('Validates a request email verification token', async () => {
      const permission = Permissions.REQUEST_EMAIL_VERIFICATION;
      const userProfile = accountService.convertToUserProfile(
        account,
        permission,
      );

      // Generate the token
      const token = await tokenService.generateToken(userProfile);
      expect(token).not.to.be.Null();
      expect(token.length).to.be.greaterThan(0);

      // Get the token result
      const resultProfle = await tokenService.verifyToken(token);

      expect(resultProfle).not.to.be.Undefined();
      expect(resultProfle.permissions).to.be.Array();
      expect(resultProfle.permissions).to.be.deepEqual([
        Permissions.REGULAR,
        permission,
      ]);

      // Verify the token has not been deleted
      let error;
      try {
        await tokenService.verifyToken(token);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.undefined();
    });

    it('Validates a verify email token', async () => {
      const permission = Permissions.VERIFY_EMAIL;
      const userProfile = accountService.convertToUserProfile(
        account,
        permission,
      );

      // Generate the token
      const token = await tokenService.generateToken(userProfile);
      expect(token).not.to.be.Null();
      expect(token.length).to.be.greaterThan(0);

      // Get the token result
      const resultProfle = await tokenService.verifyToken(token);

      expect(resultProfle).not.to.be.Undefined();
      expect(resultProfle.permissions).to.be.Array();
      expect(resultProfle.permissions).to.be.deepEqual([permission]);
    });

    it('Validates a recover password token', async () => {
      const permission = Permissions.RECOVER_PASSWORD;
      const userProfile = accountService.convertToUserProfile(
        account,
        permission,
      );

      // Generate the token
      const token = await tokenService.generateToken(userProfile);
      expect(token).not.to.be.Null();
      expect(token.length).to.be.greaterThan(0);

      // Get the token result
      const resultProfle = await tokenService.verifyToken(token);

      expect(resultProfle).not.to.be.Undefined();
      expect(resultProfle.permissions).to.be.Array();
      expect(resultProfle.permissions).to.be.deepEqual([permission]);
    });
  });
});
