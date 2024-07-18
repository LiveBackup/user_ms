import {Entity, hasMany, hasOne, model, property} from '@loopback/repository';
import {
  AccountCredentialsEntity,
  AccountCredentialsWithRelations,
} from './account-credentials.entity';
import {TokenEntity, TokenWithRelations} from './token.entity';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'public', table: 'account'},
  },
})
export class AccountEntity extends Entity {
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
  })
  username: string;

  @property({
    type: 'string',
    required: true,
    index: {unique: true},
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

  @hasOne(() => AccountCredentialsEntity, {keyTo: 'accountId', keyFrom: 'id'})
  accountCredentials: AccountCredentialsEntity;

  @hasMany(() => TokenEntity, {keyTo: 'accountId', keyFrom: 'id'})
  tokens: TokenEntity[];
}

export interface AccountRelations {
  accountCredentials: AccountCredentialsWithRelations;
  tokens: TokenWithRelations[];
}

export type AccountWithRelations = AccountEntity & AccountRelations;
