import * as DefaultTokenService from '@loopback/authentication';
import {BindingKey, BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {UserProfile, securityId} from '@loopback/security';
import jwt from 'jsonwebtoken';
import {TokenRepository} from '../repositories';

export enum Permissions {
  REGULAR = 'REGULAR',
  RECOVER_PASSWORD = 'RECOVER_PASSWORD',
  REQUEST_EMAIL_VERIFICATION = 'REQUEST_EMAIL_VERIFICATION',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
}

export type ExtendedUserProfile = UserProfile & {
  permissions: Permissions[];
  username: string;
};

export namespace TokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>(
    'authentication.jwt.secret',
  );
  export const TOKEN_REGULAR_EXPIRES_IN = BindingKey.create<number>(
    'authentication.jwt.regular.expires.in.seconds',
  );
  export const TOKEN_VERIFICATE_EMAIL_EXPIRES_IN = BindingKey.create<number>(
    'authentication.jwt.verificate-email.expires.in.seconds',
  );
  export const TOKEN_RECOVERY_PASSWORD_EXPIRES_IN = BindingKey.create<number>(
    'authentication.jwt.recovery-password.expires.in.seconds',
  );
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.authentication.jwt.tokenservice',
  );
}

@injectable({scope: BindingScope.TRANSIENT})
export class TokenService implements DefaultTokenService.TokenService {
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
  ) { }

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
    const tokenInfo = {
      id: userProfile[securityId],
      email: userProfile.email,
      name: userProfile.username,
      permissions: userProfile.permissions,
    };

    const expiresIn = this.getExpirationTime(userProfile.permissions[0]);
    const tokenValue: string = jwt.sign(tokenInfo, this.secret, {expiresIn});

    const dbToken = await this.tokenRepository.create({
      tokenValue,
      accountId: userProfile[securityId],
      expirationDate: new Date(new Date().valueOf() + expiresIn),
    });

    return dbToken.tokenValue;
  }

  async verifyToken(token: string): Promise<ExtendedUserProfile> {
    if (!token) {
      throw new HttpErrors[401](
        'Error verifying the Token: No token was provided',
      );
    }

    const dbToken = await this.tokenRepository.findOne({
      where: {
        tokenValue: token,
      },
    });
    if (!dbToken) throw new HttpErrors[401]('The token is not stored in db');

    let userProfile: ExtendedUserProfile;
    try {
      // eslint-disable-next-line
      const decodedToken = jwt.verify(token, this.secret) as any;
      userProfile = Object.assign(
        {[securityId]: '', email: ''},
        {
          [securityId]: decodedToken.id,
          username: decodedToken.name,
          email: decodedToken.email,
          permissions: decodedToken.permissions,
        },
      );
    } catch (error) {
      throw new HttpErrors[401](`Error decoding the token: ${error.message}`);
    }
    return userProfile;
  }
}
