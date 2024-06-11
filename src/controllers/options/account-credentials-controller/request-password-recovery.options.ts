import {RequestBodyObject, getModelSchemaRef} from '@loopback/rest';
import {PasswordRecoveryRequestDto} from '../../../dtos';

export const PasswordRecoveryRequestBodyOptions: Partial<RequestBodyObject> = {
  description: 'The account email address to send the recovery information',
  content: {
    'application/json': {
      schema: getModelSchemaRef(PasswordRecoveryRequestDto),
    },
  },
};
