import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Account} from './account.model';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'public', table: 'account_credentials'},
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
}

export interface AccountCredentialsRelations {
  username: string;
  email: string;
}

export type AccountCredentialsWithRelations = AccountCredentials &
  AccountCredentialsRelations;
