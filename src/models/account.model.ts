import {Entity, model, property, hasOne} from '@loopback/repository';
import {AccountCredentials} from './account-credentials.model';

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
  email: string;

  @property({
    type: 'boolean',
    default: true,
  })
  is_email_verified?: boolean;

  @hasOne(() => AccountCredentials, {keyTo: 'account_id'})
  account_credentials: AccountCredentials;

  constructor(data?: Partial<Account>) {
    super(data);
  }
}

export interface AccountRelations {
  // describe navigational properties here
}

export type AccountWithRelations = Account & AccountRelations;
