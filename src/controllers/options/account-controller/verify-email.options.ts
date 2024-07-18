import {ResponseModelOrSpec, getModelSchemaRef} from '@loopback/rest';
import {AccountDto} from '../../../dtos';

export const VerifyEmail200ResponseOptions: ResponseModelOrSpec = {
  description: 'Verify the account email address',
  content: {
    'application/json': {
      schema: getModelSchemaRef(AccountDto),
    },
  },
};
