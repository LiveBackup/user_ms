import {
  RequestBodyObject,
  ResponseModelOrSpec,
  getModelSchemaRef,
} from '@loopback/rest';
import {LoginRequestDto, TokenDto} from '../../../dtos';

export const Login200ResponseOptions: ResponseModelOrSpec = {
  description: 'A valid access token for regular operations',
  content: {
    'application/json': {
      schema: getModelSchemaRef(TokenDto),
    },
  },
};

export const LoginRequestBodyOptions: Partial<RequestBodyObject> = {
  description: 'The user credentials for the login',
  content: {
    'application/json': {
      schema: getModelSchemaRef(LoginRequestDto),
    },
  },
};
