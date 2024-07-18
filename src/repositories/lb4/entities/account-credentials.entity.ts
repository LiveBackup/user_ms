import {belongsTo, Entity, model, property} from '@loopback/repository';
import {AccountEntity, AccountWithRelations} from './account.entity';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'public', table: 'account_credentials'},
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
export class AccountCredentialsEntity extends Entity {
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
}

export interface AccountCredentialsRelations {
  account: AccountWithRelations;
}

export type AccountCredentialsWithRelations = AccountCredentialsEntity &
  AccountCredentialsRelations;
