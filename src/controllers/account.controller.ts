import {authenticate, TokenService} from '@loopback/authentication';
import {TokenServiceBindings} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {
  get,
  getModelSchemaRef,
  HttpErrors,
  post,
  requestBody,
  Response,
  response,
  RestBindings,
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Account, AccountCredentials} from '../models';
import {
  LoginResquestSchemaDescription,
  LoginResquestSchemaObject,
  NewUserResquestSchemaDescription,
  NewUserResquestSchemaObject,
  TokenResponseSchemaObject,
} from '../schemas';
import {AccountCredentialsService, AccountService} from '../services';

export class AccountController {
  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected httpResponse: Response,
    @inject('services.AccountService')
    protected accountService: AccountService,
    @inject('services.AccountCredentialsService')
    protected accountCredentialsService: AccountCredentialsService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    protected jwtService: TokenService,
  ) { }

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
    /* eslint-disable @typescript-eslint/naming-convention */
    const newAccount = await this.accountService.create(
      new Account({
        email,
        username,
        registered_at: new Date(),
      }),
    );
    /* eslint-enable @typescript-eslint/naming-convention */

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

  // FIXME: The response documentation is not rigth in the swagger
  @post('/login')
  @response(200, {
    description: 'Request a JWT by given tha account credentials',
    content: {
      'application/json': {
        schema: getModelSchemaRef(TokenResponseSchemaObject),
      },
    },
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: LoginResquestSchemaDescription,
        },
      },
    })
    loginRequest: LoginResquestSchemaObject,
  ): Promise<TokenResponseSchemaObject> {
    const wrongCredentialsError = new HttpErrors[400](
      'Incorrect username or password',
    );

    const {username, password} = loginRequest;
    const account = await this.accountService.findByUsername(username);

    if (account === null) {
      throw wrongCredentialsError;
    } else if (!account.is_email_verified) {
      throw new HttpErrors[401]('Emails has not been verified');
    }

    const accountCredentials =
      await this.accountCredentialsService.getCredentialsByAccountId(
        account.id,
      );
    if (accountCredentials === null) {
      throw new HttpErrors[404]('User credential not found');
    }

    const isValidPassowrd = await this.accountCredentialsService.verifyPassword(
      password,
      accountCredentials.password,
    );

    if (!isValidPassowrd) {
      throw wrongCredentialsError;
    }

    const userProfile = this.accountService.convertToUserProfile(account);
    const token = await this.jwtService.generateToken(userProfile);
    return {token};
  }

  // FIXME: The response documentation is not rigth in the swagger
  @authenticate('jwt')
  @get('/who-am-i')
  @response(200, {
    description: 'Return the account information',
    content: {
      'application/json': {
        schema: getModelSchemaRef(TokenResponseSchemaObject),
      },
    },
  })
  async whoAmI(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<Account> {
    const account = await this.accountService.findById(currentUser[securityId]);
    if (account === null) {
      throw new HttpErrors[404]('No account was found');
    }

    return account;
  }
}
