import {model, property} from '@loopback/repository';

@model()
export class LoginRequestDto {
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 3,
    },
  })
  usernameOrEmail: string;

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
