import {property} from '@loopback/repository';
import {SchemaObject} from '@loopback/rest';

export class TokenResponseSchemaObject {
  @property({
    type: 'string',
  })
  token: string;
}

export const TokenResponseSchemaDescription: SchemaObject = {
  type: 'object',
  properties: {
    token: {
      type: 'string',
    },
  },
};
