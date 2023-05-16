import {model, property} from '@loopback/repository';

@model()
export class TokenResponse {
  @property({
    type: 'string',
  })
  token: string;
}
