import {
  RequestBodyObject,
  ResponseModelOrSpec,
  getModelSchemaRef,
} from '@loopback/rest';
import {AccountDto, NewAccountDto} from '../../../dtos';

export const SignUp201ResponseOptions: ResponseModelOrSpec = {
  description: 'The created user account information',
  content: {
    'application/json': {
      schema: getModelSchemaRef(AccountDto),
    },
  },
};

export const SignUpRequestBodyOptions: Partial<RequestBodyObject> = {
  description: 'The account information to create',
  content: {
    'application/json': {
      schema: getModelSchemaRef(NewAccountDto),
    },
  },
};
