import {Principal} from '@loopback/security';
import {Permissions} from './token.model';

export type UserProfileRequest = Principal & {
  username: string;
  email: string;
  requestedPermission: Permissions;
};
