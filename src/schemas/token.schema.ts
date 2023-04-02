import {property} from '@loopback/repository';

export class TokenResponseSchemaObject {
  @property({
    type: 'string',
  })
  token: string;
}
