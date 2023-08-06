import {TokenService as DefaultTokenService} from '@loopback/authentication';
import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {Principal, securityId} from '@loopback/security';
import {AES, enc} from 'crypto-js';
import {v4 as uuidv4} from 'uuid';
import {Permissions, Token} from '../models';
import {TokenRepository} from '../repositories';

export type ExtendedUserProfile = Principal & {
  permissions: Permissions[];
};

export namespace TokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>(
    'services.TokenService.secret',
  );
  export const TOKEN_REGULAR_EXPIRES_IN = BindingKey.create<number>(
    'services.TokenService.regular.expires.in.seconds',
  );
  export const TOKEN_VERIFICATE_EMAIL_EXPIRES_IN = BindingKey.create<number>(
    'services.TokenService.verificate-email.expires.in.seconds',
  );
  export const TOKEN_RECOVERY_PASSWORD_EXPIRES_IN = BindingKey.create<number>(
    'services.TokenService.recovery-password.expires.in.seconds',
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
    @inject(TokenServiceBindings.TOKEN_REGULAR_EXPIRES_IN)
    private regularTokenExpiration: number,
    @inject(TokenServiceBindings.TOKEN_VERIFICATE_EMAIL_EXPIRES_IN)
    private emailVerificationTokenExpiration: number,
    @inject(TokenServiceBindings.TOKEN_RECOVERY_PASSWORD_EXPIRES_IN)
    private passwordRecoveryTokenExpiration: number,
  ) {}

  private getExpirationTime(permission: Permissions): number {
    switch (permission) {
      case Permissions.VERIFY_EMAIL:
        return this.emailVerificationTokenExpiration;
      case Permissions.RECOVER_PASSWORD:
        return this.passwordRecoveryTokenExpiration;
      default:
        return this.regularTokenExpiration;
    }
  }

  private validatePermissions(permissions: Permissions[]): void {
    if (permissions === undefined) {
      throw new Error('Permissions array must be provided');
    } else if (permissions.length < 1) {
      throw new Error('Permissions array must contain at least 1 permission');
    } else if (permissions.length > 2) {
      throw new Error(
        'Permissions array can not contain at more than 2 permissions',
      );
    } else if (permissions.length === 2) {
      if (
        !(
          permissions.includes(Permissions.REGULAR) &&
          permissions.includes(Permissions.REQUEST_EMAIL_VERIFICATION)
        )
      ) {
        throw new Error(
          `Combination of permissions are not allowed: ${permissions}`,
        );
      }
    }
  }

  async generateToken(userProfile: ExtendedUserProfile): Promise<string> {
    this.validatePermissions(userProfile.permissions);

    const expiresIn = this.getExpirationTime(userProfile.permissions[0]);
    const tokenValue: string = uuidv4();

    const token: Partial<Token> = {
      tokenValue: AES.encrypt(tokenValue, this.secret).toString(),
      accountId: userProfile[securityId],
      expirationDate: new Date(new Date().valueOf() + expiresIn),
      allowedActions: userProfile.permissions,
    };
    const dbToken = await this.tokenRepository.create(token);

    return `${dbToken.id}-${tokenValue}`;
  }

  async verifyToken(token: string): Promise<ExtendedUserProfile> {
    const invalidTokenError = new HttpErrors[401](
      'Error verifying the token: Invalid Token',
    );
    if (!token) {
      const message = 'Error verifying the Token: No token was provided';
      throw new HttpErrors[401](message);
    }

    const tokenParts = token.split('-');
    if (tokenParts.length !== 10) throw invalidTokenError;

    const tokenId = tokenParts.slice(0, 5).join('-');
    const tokenSecret = tokenParts.slice(-5).join('-');

    // Get the token from DB
    const dbToken = await this.findById(tokenId);
    // Verify if the token exists and the expiration date is valid
    if (!dbToken) {
      throw invalidTokenError;
    } else if (dbToken.expirationDate.valueOf() < new Date().valueOf()) {
      throw new HttpErrors[401]('Error verifying the token: Token has expired');
    }

    const decryptedStoredToken = AES.decrypt(
      dbToken.tokenValue,
      this.secret,
    ).toString(enc.Utf8);

    if (tokenSecret !== decryptedStoredToken) throw invalidTokenError;

    const userProfile: ExtendedUserProfile = {
      [securityId]: dbToken.accountId,
      permissions: dbToken.allowedActions,
    };

    return userProfile;
  }

  async findById(id: string): Promise<Token | null> {
    try {
      return await this.tokenRepository.findById(id);
    } catch (error) {
      return null;
    }
  }
}
