import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    idInjection: false,
    postgresql: {schema: 'public', table: 'token'}
  }
})
export class Token extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'token_value',
    },
  })
  tokenValue: string;

  @property({
    type: 'date',
    postgresql: {
      columnName: 'expiration_date',
    },
  })
  expirationDate?: string;


  constructor(data?: Partial<Token>) {
    super(data);
  }
}

export interface TokenRelations {
  // describe navigational properties here
}

export type TokenWithRelations = Token & TokenRelations;
