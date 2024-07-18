import {Entity, belongsTo, model, property} from '@loopback/repository';
import {Permission} from '../../../models';
import {AccountEntity, AccountWithRelations} from './account.entity';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'public', table: 'token'},
    foreignKeys: {
      // eslint-disable-next-line
      account_id_fkey: {
        name: 'account_id_fkey',
        entity: 'AccountEntity',
        entityKey: 'id',
        foreignKey: 'account_id',
      },
    },
  },
})
export class TokenEntity extends Entity {
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
    () => AccountEntity,
    {
      name: 'account',
      keyFrom: 'accountId',
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
  allowedActions: Permission[];

  @property({
    type: 'date',
    required: true,
    postgresql: {
      columnName: 'expiration_date',
      dataType: 'timestamptz',
    },
  })
  expirationDate: Date;
}

export interface TokenRelations {
  account?: AccountWithRelations;
}

export type TokenWithRelations = TokenEntity & TokenRelations;
