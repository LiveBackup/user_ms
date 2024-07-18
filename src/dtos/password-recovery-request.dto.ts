import {model, property} from '@loopback/repository';

@model()
export class PasswordRecoveryRequestDto {
  @property({
    type: 'string',
    jsonSchema: {
      format: 'email',
    },
  })
  email: string;
}
