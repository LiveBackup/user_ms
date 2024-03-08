import {model, property} from '@loopback/repository';

@model()
export class TokenDto {
  @property({
    type: 'string',
  })
  readonly token: string;
}
