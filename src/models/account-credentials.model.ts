import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Account} from './account.model';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'public', table: 'account_credentials'},
    foreignKeys: {
      fkCredentialsAccountId: {
        name: 'fk_credentials_accountId',
        entity: 'Account',
        entityKey: 'id',
        foreignKey: 'account_id',
      },
    },
  },
})
export class AccountCredentials extends Entity {
  @property({
    type: 'string',
    id: true,
    defaultFn: 'uuidv4',
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 8,
      format: 'password',
    },
  })
  password: string;

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

  constructor(data?: Partial<AccountCredentials>) {
    super(data);
  }
}

export interface AccountCredentialsRelations {
  username: string;
  email: string;
}

export type AccountCredentialsWithRelations = AccountCredentials &
  AccountCredentialsRelations;
