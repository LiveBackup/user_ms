import {Credentials} from '../account-credentials';

export interface Account {
  id: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
  registeredAt: Date;
  // Related models
  accountCredentials?: Credentials;
}
