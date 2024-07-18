import {Principal} from '@loopback/security';
import {Permission} from './token.model';

export type ExtendedUserProfile = Principal & {
  token: string;
  isOneUsageProfile: boolean;
  permissions: Permission[];
};
