import {TokenService as DefaultTokenService} from '@loopback/authentication';
import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {Principal, securityId} from '@loopback/security';
import {AES, enc} from 'crypto-js';
import {v4 as uuidv4} from 'uuid';
import {Permissions, Token} from '../models';
import {TokenRepository} from '../repositories';

export type RequestUserProfile = Principal & {
  permission: Permissions;
};

export type ExtendedUserProfile = Principal & {
  token: string;
  isOneUsageProfile: boolean;
  permissions: Permissions[];
};

export namespace TokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>(
    'services.TokenService.secret',
  );
  export const TOKEN_REGULAR_EXPIRATION_TIME = BindingKey.create<number>(
    'services.TokenService.regular.expiration-time',
  );
  export const VERIFICATION_EMAIL_TOKEN_EXPIRATION_TIME =
    BindingKey.create<number>(
      'services.TokenService.verification-email.expiration-time',
    );
  export const PASSWORD_RECOVERY_TOKEN_EXPIRATION_TIME =
    BindingKey.create<number>(
      'services.TokenService.password-recovery.expiration-time',
    );
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.authentication.jwt.tokenservice',
  );
}

@injectable({scope: BindingScope.SINGLETON})
export class TokenService implements DefaultTokenService {
  constructor(
    @repository(TokenRepository)
    private tokenRepository: TokenRepository,
    @inject(TokenServiceBindings.TOKEN_SECRET)
    private secret: string,
    @inject(TokenServiceBindings.TOKEN_REGULAR_EXPIRATION_TIME)
    private regularTokenExpiration: number,
    @inject(TokenServiceBindings.VERIFICATION_EMAIL_TOKEN_EXPIRATION_TIME)
    private emailVerificationTokenExpiration: number,
    @inject(TokenServiceBindings.PASSWORD_RECOVERY_TOKEN_EXPIRATION_TIME)
    private passwordRecoveryTokenExpiration: number,
  ) {}

  private getTokenData(permission: Permissions): Partial<Token> {
    let isOneUsageToken: boolean;
    let allowedActions: Permissions[];
    let lifeTime: number;

    // Fill the values
    switch (permission) {
      case Permissions.REGULAR:
        isOneUsageToken = false;
        allowedActions = [Permissions.REGULAR];
        lifeTime = this.regularTokenExpiration;
        break;
      case Permissions.RECOVER_PASSWORD:
        isOneUsageToken = true;
        allowedActions = [Permissions.RECOVER_PASSWORD];
        lifeTime = this.passwordRecoveryTokenExpiration;
        break;
      case Permissions.REQUEST_EMAIL_VERIFICATION:
        isOneUsageToken = false;
        allowedActions = [
          Permissions.REGULAR,
          Permissions.REQUEST_EMAIL_VERIFICATION,
        ];
        lifeTime = this.regularTokenExpiration;
        break;
      default: // VERIFY_EMAIL
        isOneUsageToken = true;
        allowedActions = [Permissions.VERIFY_EMAIL];
        lifeTime = this.emailVerificationTokenExpiration;
        break;
    }

    // Calculate the token expiration date
    const expirationDate = new Date(new Date().valueOf() + lifeTime);
    // Return the object
    return {isOneUsageToken, allowedActions, expirationDate};
  }

  public getTokenParts(token: string): string[] {
    // Define the error
    const invalidTokenError = new HttpErrors[401](
      'Error verifying the token: Invalid Token',
    );
    // Split the token
    const tokenParts = token.split('-');
    if (tokenParts.length !== 10) throw invalidTokenError;

    // Join the token id
    const tokenId = tokenParts.slice(0, 5).join('-');
    // Join the token secret
    const tokenSecret = tokenParts.slice(-5).join('-');
    // Return the token parts
    return [tokenId, tokenSecret];
  }

  async generateToken(userProfile: RequestUserProfile): Promise<string> {
    if (!userProfile.permission)
      throw new Error('User permission must be provided');

    const tokenSecret: string = uuidv4();

    const token: Partial<Token> = this.getTokenData(userProfile.permission);
    token.tokenSecret = AES.encrypt(tokenSecret, this.secret).toString();
    token.accountId = userProfile[securityId];
    const dbToken = await this.tokenRepository.create(new Token(token));

    return `${dbToken.id}-${tokenSecret}`;
  }

  async verifyToken(token: string): Promise<ExtendedUserProfile> {
    const invalidTokenError = new HttpErrors[401](
      'Error verifying the token: Invalid Token',
    );
    if (!token) {
      const message = 'Error verifying the Token: No token was provided';
      throw new HttpErrors[401](message);
    }

    // Get the token parts
    const [tokenId, tokenSecret] = this.getTokenParts(token);

    // Get the token from DB
    const dbToken = await this.findById(tokenId);
    // Verify if the token exists and the expiration date is valid
    if (!dbToken) throw invalidTokenError;
    else if (dbToken.expirationDate.valueOf() < new Date().valueOf())
      throw new HttpErrors[401]('Error verifying the token: Token has expired');

    // Decrypt the stored token secret
    const decryptedStoredToken = AES.decrypt(
      dbToken.tokenSecret,
      this.secret,
    ).toString(enc.Utf8);

    // Compare the given and stored token secrets
    if (tokenSecret !== decryptedStoredToken) throw invalidTokenError;

    // Create the user profile
    const userProfile: ExtendedUserProfile = {
      [securityId]: dbToken.accountId,
      permissions: dbToken.allowedActions,
      token,
      isOneUsageProfile: dbToken.isOneUsageToken,
    };

    return userProfile;
  }

  async revokeToken(token: string): Promise<boolean> {
    // Split the token
    const [tokenId, tokenSecret] = this.getTokenParts(token);

    // Get the token from db
    const dbToken = await this.findById(tokenId);
    // Verify if the token exists and the expiration date is valid
    if (!dbToken) return false;

    // Decrypt the stored token secret
    const decryptedStoredToken = AES.decrypt(
      dbToken.tokenSecret,
      this.secret,
    ).toString(enc.Utf8);

    // Compare the given and stored token secrets
    if (tokenSecret !== decryptedStoredToken) return false;

    // Remove the token from db
    await this.tokenRepository.deleteById(tokenId);

    return true;
  }

  async findById(id: string): Promise<Token | null> {
    try {
      return await this.tokenRepository.findById(id);
    } catch (error) {
      return null;
    }
  }
}
