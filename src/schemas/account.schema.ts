import {property} from '@loopback/repository';

export class NewUserResquestSchema {
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
