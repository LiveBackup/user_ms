import {Entity, model, property} from '@loopback/repository';

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
      columnName: 'token_value',
    },
  })
  tokenValue: string;

  @property({
    type: 'date',
    postgresql: {
      columnName: 'expiration_date',
      dataType: 'timestamptz',
    },
  })
  expirationDate?: Date;

  @property({
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'account_id',
    },
  })
  accountId: string;

  constructor(data?: Partial<Token>) {
    super(data);
  }
}

export interface TokenRelations {
  // describe navigational properties here
}

export type TokenWithRelations = Token;
