import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
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
  TokenResponseSchemaDescription,
  TokenResponseSchemaObject,
} from '../schemas';
import {
  AccountCredentialsService,
  AccountService,
  CustomTokenService,
  CustomTokenServiceBindings,
  Permissions,
  TasksQueuesService,
} from '../services';

export class AccountController {
  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected httpResponse: Response,
    @inject('services.AccountService')
    protected accountService: AccountService,
    @inject('services.AccountCredentialsService')
    protected accountCredentialsService: AccountCredentialsService,
    @inject('services.TasksQueuesService')
    protected tasksQueuesService: TasksQueuesService,
    @inject(CustomTokenServiceBindings.TOKEN_SERVICE)
    protected jwtService: CustomTokenService,
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

  @post('/login')
  @response(200, {
    description: 'Request a JWT by giving the account credentials',
    content: {
      'application/json': {
        schema: TokenResponseSchemaDescription,
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

    const permission = account.is_email_verified
      ? Permissions.REGULAR
      : Permissions.REQUEST_EMAIL_VERIFICATION;
    const userProfile = this.accountService.convertToUserProfile(
      account,
      permission,
    );
    const token = await this.jwtService.generateToken(userProfile);
    return {token};
  }

  @authenticate('jwt')
  @get('/who-am-i')
  @response(200, {
    description: 'Return the account information',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Account),
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

  @authenticate('jwt')
  @authorize({allowedRoles: [Permissions.REQUEST_EMAIL_VERIFICATION]})
  @post('/verify-email')
  @response(204)
  async verifyEmail(@inject(SecurityBindings.USER) currentUser: UserProfile) {
    const account = await this.accountService.findById(currentUser[securityId]);
    if (account === null) {
      throw new HttpErrors[404]('No account was found');
    } else if (account.is_email_verified) {
      throw new HttpErrors[400]('Emails has already been verified');
    }

    const userProfile = this.accountService.convertToUserProfile(
      account,
      Permissions.VERIFY_EMAIL,
    );
    const emailVerificationToken = await this.jwtService.generateToken(
      userProfile,
    );

    // Enqueue the verification email delivery
    const tasksStatus = await this.tasksQueuesService.enqueueVerificationEmail(
      account.username,
      account.email,
      emailVerificationToken,
    );

    if (!tasksStatus) {
      throw new HttpErrors[500]('Could not add the tasks to the queue');
    }
  }
}
