import {model, property} from '@loopback/repository';
import {Credentials} from './credentials.schema';

@model()
export class NewAccount extends Credentials {
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      format: 'email',
    },
  })
  email: string;
}
