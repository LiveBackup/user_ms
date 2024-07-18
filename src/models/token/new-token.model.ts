import {Permission} from './token.model';

export interface NewToken {
  tokenSecret: string;
  isOneUsageToken: boolean;
  accountId: string;
  allowedActions: Permission[];
  expirationDate: Date;
}
