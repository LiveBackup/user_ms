import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Account} from './account.model';

@model()
export class AccountCredentials extends Entity {
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
    jsonSchema: {
      minLength: 8,
      format: 'password',
    },
  })
  password: string;

  @belongsTo(
    () => Account,
    {
      name: 'account_credentials',
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
