import {property} from '@loopback/repository';
import {SchemaObject} from '@loopback/rest';

export class NewUserResquestSchemaObject {
  @property({
    type: 'string',
    required: true
  }) username: string;

  @property({
    type: 'string',
    required: true
  }) email: string;

  @property({
    type: 'string',
    required: true
  }) password: string;
};

export const NewUserResquestSchemaDescription: SchemaObject = {
  type: 'object',
  required: ['username', 'email', 'password'],
  properties: {
    username: {
      type: 'string',
    },
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};
