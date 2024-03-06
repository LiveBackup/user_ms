import {model, property} from '@loopback/repository';

@model()
export class UpdatePasswordDto {
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
