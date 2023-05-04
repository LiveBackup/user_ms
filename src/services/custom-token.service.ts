import {TokenService} from '@loopback/authentication';
import {BindingKey, inject} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {UserProfile, securityId} from '@loopback/security';
import jwt from 'jsonwebtoken';

export enum Permissions {
  REGULAR = 'REGULAR',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  REQUEST_EMAIL_VERIFICATION = 'REQUEST_EMAIL_VERIFICATION',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
}

export type ExtendedUserProfile = UserProfile & {
  permission: Permissions;
  username: string;
};

export namespace CustomTokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>(
    'authentication.jwt.secret',
  );
  export const TOKEN_REGULAR_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.regular.expires.in.seconds',
  );
  export const TOKEN_UPDATE_PASSWORD_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.update-password.expires.in.seconds',
  );
  export const TOKEN_VERIFICATE_EMAIL_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.verificate-email.expires.in.seconds',
  );
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.authentication.jwt.tokenservice',
  );
}

export class CustomTokenService implements TokenService {
  constructor(
    @inject(CustomTokenServiceBindings.TOKEN_SECRET)
    private secret: string,
    @inject(CustomTokenServiceBindings.TOKEN_REGULAR_EXPIRES_IN)
    private regularTokenExpiration: string,
    @inject(CustomTokenServiceBindings.TOKEN_UPDATE_PASSWORD_EXPIRES_IN)
    private passwordUpdateTokenExpiration: string,
    @inject(CustomTokenServiceBindings.TOKEN_VERIFICATE_EMAIL_EXPIRES_IN)
    private emailVerificationTokenExpiration: string,
  ) {}

  private getExpirationTime(permission: Permissions): string {
    switch (permission) {
      case Permissions.VERIFY_EMAIL:
        return this.emailVerificationTokenExpiration;
      case Permissions.UPDATE_PASSWORD:
        return this.passwordUpdateTokenExpiration;
      default:
        return this.regularTokenExpiration;
    }
  }

  async generateToken(userProfile: ExtendedUserProfile): Promise<string> {
    if (!userProfile) {
      throw new Error('Error generating Token: userProfile is null');
    }

    const tokenInfo = {
      id: userProfile[securityId],
      name: userProfile.username,
      permission: userProfile.permission,
    };

    const token: string = jwt.sign(tokenInfo, this.secret, {
      expiresIn: this.getExpirationTime(userProfile.permission),
    });
    return token;
  }

  async verifyToken(token: string): Promise<ExtendedUserProfile> {
    if (!token) {
      throw new HttpErrors[401](
        'Error verifying the Token: Not token provided',
      );
    }

    let userProfile: ExtendedUserProfile;
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const decodedToken = jwt.verify(token, this.secret) as any;
      /* eslint-enable @typescript-eslint/no-explicit-any */
      userProfile = Object.assign(
        {[securityId]: '', email: ''},
        {
          [securityId]: decodedToken.id,
          username: decodedToken.username,
          email: decodedToken.email,
          permission: decodedToken.permission,
        },
      );
    } catch (error) {
      throw new HttpErrors[401](`Error decoding the token: ${error.message}`);
    }
    return userProfile;
  }
}
