import {ResponseModelOrSpec, getModelSchemaRef} from '@loopback/rest';
import {AccountDto} from '../../../dtos';

export const WhoAmI200ResponseOptions: ResponseModelOrSpec = {
  description: 'Provide the account information using the access token',
  content: {
    'application/json': {
      schema: getModelSchemaRef(AccountDto),
    },
  },
};
