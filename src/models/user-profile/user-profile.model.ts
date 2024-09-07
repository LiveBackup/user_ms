import {Principal} from '@loopback/security';
import {Permission} from '../token';

export type UserProfile = Principal & {
  token: string;
  isOneUsageProfile: boolean;
  permissions: Permission[];
};
