import {Permissions} from './token.model';

export interface NewToken {
  tokenSecret: string;
  isOneUsageToken: boolean;
  accountId: string;
  allowedActions: Permissions[];
  expirationDate: Date;
}
