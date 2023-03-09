import {inject} from '@loopback/core';
import {getModelSchemaRef, HttpErrors, post, requestBody, response} from '@loopback/rest';
import {Account, AccountCredentials} from '../models';
import {NewUserResquestSchemaDescription, NewUserResquestSchemaObject} from '../schemas';
import {AccountCredentialsService, AccountService} from '../services';

export class AccountController {
  constructor(
    @inject('services.AccountService') protected accountService: AccountService,
    @inject('services.AccountCredentialsService') protected accountCredentialsService: AccountCredentialsService,
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
          schema: NewUserResquestSchemaDescription,
        },
      },
    }) newAccountRequest: NewUserResquestSchemaObject,
  ): Promise<Account> {
    const {email, username, password} = newAccountRequest;

    // Verify if the given email and username are available
    const existAccountByEmailOrUsername = await this.accountService
      .existByEmailOrUsername(newAccountRequest.email, newAccountRequest.username);

    if (existAccountByEmailOrUsername) {
      const [accountByEmail, accountByUsername] = await Promise.all([
        this.accountService.findByEmail(email),
        this.accountService.findByUsername(username),
      ]);

      if (accountByEmail !== null)
        throw new HttpErrors[400]('There already exists an Account with the given email');
      else if (accountByUsername !== null)
        throw new HttpErrors[400]('There already exists an Account with the given username');
    }

    // Creates the account into the database
    const newAccount = await this.accountService
      .create(new Account({email, username}));

    // Creates the user credentials into the database
    await this.accountCredentialsService.create(new AccountCredentials(
      {
        account_id: newAccount.id,
        password: await this.accountCredentialsService.hashPassword(password),
      },
    ));

    return newAccount;
  };
}
