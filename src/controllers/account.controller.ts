import {inject} from '@loopback/core';
import {
  getModelSchemaRef,
  HttpErrors,
  post,
  requestBody,
  Response,
  response,
  RestBindings,
} from '@loopback/rest';
import {Account, AccountCredentials} from '../models';
import {
  NewUserResquestSchemaDescription,
  NewUserResquestSchemaObject,
} from '../schemas';
import {AccountCredentialsService, AccountService} from '../services';

export class AccountController {
  constructor(
    @inject(RestBindings.Http.RESPONSE) protected httpResponse: Response,
    @inject('services.AccountService') protected accountService: AccountService,
    @inject('services.AccountCredentialsService')
    protected accountCredentialsService: AccountCredentialsService,
  ) {}

  @post('/sign-up')
  @response(201, {
    description: 'Register a new user',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Account),
      },
    },
  })
  async signup(
    @requestBody({
      content: {
        'application/json': {
          schema: NewUserResquestSchemaDescription,
        },
      },
    })
    newAccountRequest: NewUserResquestSchemaObject,
  ): Promise<Account> {
    const {email, username, password} = newAccountRequest;

    // Verify if the given email and username are available
    const existAccountByEmailOrUsername =
      await this.accountService.existByEmailOrUsername(
        newAccountRequest.email,
        newAccountRequest.username,
      );

    if (existAccountByEmailOrUsername) {
      const accountByEmail = await this.accountService.findByEmail(email);

      const errorMessage =
        accountByEmail !== null
          ? 'There already exists an Account with the given email'
          : 'There already exists an Account with the given username';
      throw new HttpErrors[400](errorMessage);
    }

    // Creates the account into the database
    const newAccount = await this.accountService.create(
      new Account({email, username}),
    );

    // Creates the user credentials into the database
    await this.accountCredentialsService.create(
      new AccountCredentials({
        account_id: newAccount.id /* eslint-disable-line */,
        password: await this.accountCredentialsService.hashPassword(password),
      }),
    );

    this.httpResponse.status(201);
    return newAccount;
  }
}
