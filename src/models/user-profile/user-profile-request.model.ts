import {Principal} from '@loopback/security';
import {Permission} from '../token';

export type UserProfileRequest = Principal & {
  username: string;
  email: string;
  requestedPermission: Permission;
};
