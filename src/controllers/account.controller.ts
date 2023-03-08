import {inject} from '@loopback/core';
import {getModelSchemaRef, post, requestBody, response} from '@loopback/rest';
import {Account} from '../models';
import {NewUserResquestSchema} from '../schemas';
import {AccountService} from '../services';

export class AccountController {
  constructor(
    @inject('services.AccountService') protected accountService: AccountService,
  ) { }

  @post('/sign-up')
  @response(201, {
    description: 'Register a new user',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Account),
      },
    },
  }) async signup(
    @requestBody({
      content: {
        'application/json': {
          schema: NewUserResquestSchema,
        },
      },
    }) newAccountRequest: NewUserResquestSchema,
  ): Promise<Account> {
    // TODO: Implement method
    return new Account();
  };
}
