import {Entity, hasOne, model, property} from '@loopback/repository';
import {AccountCredentials} from './account-credentials.model';

/* eslint-disable @typescript-eslint/naming-convention */
@model()
export class Account extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuidv4',
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  username: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'boolean',
    default: false,
  })
  is_email_verified: boolean;

  @hasOne(() => AccountCredentials, {keyTo: 'account_id'})
  account_credentials: AccountCredentials;

  constructor(data?: Partial<Account>) {
    super(data);
  }
}

export interface AccountRelations {
  password: string;
}

export type AccountWithRelations = Account & AccountRelations;
