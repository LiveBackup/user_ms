import {Principal} from '@loopback/security';
import {Permissions} from './token.model';

export type ExtendedUserProfile = Principal & {
  token: string;
  isOneUsageProfile: boolean;
  permissions: Permissions[];
};
