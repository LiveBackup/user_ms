import {RequestBodyObject, getModelSchemaRef} from '@loopback/rest';
import {UpdatePasswordDto} from '../../../dtos';

export const UpdatePasswordRequestOptions: Partial<RequestBodyObject> = {
  description: 'The new account password',
  content: {
    'application/json': {
      schema: getModelSchemaRef(UpdatePasswordDto),
    },
  },
};
