import {model, property} from '@loopback/repository';

@model()
export class LoginDto {
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 3,
    },
  })
  username: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      format: 'password',
      minLength: 8,
    },
  })
  password: string;
}