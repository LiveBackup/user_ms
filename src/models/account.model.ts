import {Entity, hasOne, model, property} from '@loopback/repository';
import {AccountCredentials} from './account-credentials.model';

/* eslint-disable @typescript-eslint/naming-convention */
@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'public', table: 'account'},
  },
})
export class Account extends Entity {
  @property({
    type: 'string',
    id: true,
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
    jsonSchema: {
      format: 'email',
    },
  })
  email: string;

  @property({
    type: 'boolean',
    default: false,
    postgresql: {
      columnName: 'is_email_verified',
    },
  })
  isEmailVerified: boolean;

  @property({
    type: 'date',
    required: true,
    postgresql: {
      columnName: 'registered_at',
      dataType: 'timestamptz',
    },
  })
  registeredAt: Date;

  @hasOne(() => AccountCredentials, {keyTo: 'accountId', keyFrom: 'id'})
  account_credentials: AccountCredentials;

  constructor(data?: Partial<Account>) {
    super(data);
  }
}

export interface AccountRelations {
  password: string;
}

export type AccountWithRelations = Account & AccountRelations;
