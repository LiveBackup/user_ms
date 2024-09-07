import {Permission} from '../token.model';

export interface NewToken {
  tokenSecret: string;
  accountId: string;
  isOneUsageToken: boolean;
  allowedActions: Permission[];
  expirationDate: Date;
}
