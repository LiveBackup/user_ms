import {model, property} from '@loopback/repository';

@model()
export class AccountDto {
  @property({
    type: 'string',
    jsonSchema: {
      format: 'uuid',
    },
  })
  readonly id: string;

  @property({type: 'string'})
  readonly username: string;

  @property({
    type: 'string',
    jsonSchema: {
      format: 'email',
    },
  })
  readonly email: string;

  @property({type: 'boolean'})
  readonly isEmailVerified: boolean;

  @property({type: 'date'})
  readonly registeredAt: Date;
}
