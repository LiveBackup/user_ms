import {Entity, belongsTo, model, property} from '@loopback/repository';
import {Account, AccountWithRelations} from './account.model';

export enum Permissions {
  REGULAR = 'REGULAR',
  RECOVER_PASSWORD = 'RECOVER_PASSWORD',
  REQUEST_EMAIL_VERIFICATION = 'REQUEST_EMAIL_VERIFICATION',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
}

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'public', table: 'token'},
    foreignKeys: {
      // eslint-disable-next-line
      account_id_fkey: {
        name: 'account_id_fkey',
        entity: 'Account',
        entityKey: 'id',
        foreignKey: 'account_id',
      },
    },
  },
})
export class Token extends Entity {
  @property({
    type: 'string',
    id: true,
    defaultFn: 'uuidv4',
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    index: {unique: true},
    postgresql: {
      columnName: 'token_secret',
    },
  })
  tokenSecret: string;

  @property({
    type: 'boolean',
    default: false,
    postgresql: {
      columnName: 'is_one_usage_token',
    },
  })
  isOneUsageToken: boolean;

  @belongsTo(
    () => Account,
    {
      name: 'account',
      keyFrom: 'account_id',
      keyTo: 'id',
    },
    {
      type: 'string',
      required: true,
      postgresql: {
        columnName: 'account_id',
      },
    },
  )
  accountId: string;

  @property.array('string', {
    postgresql: {
      columnName: 'allowed_actions',
    },
  })
  allowedActions: Permissions[];

  @property({
    type: 'date',
    required: true,
    postgresql: {
      columnName: 'expiration_date',
      dataType: 'timestamptz',
    },
  })
  expirationDate: Date;

  constructor(data?: Partial<Token>) {
    super(data);
  }
}

export interface TokenRelations {
  account?: AccountWithRelations;
}

export type TokenWithRelations = Token & TokenRelations;
