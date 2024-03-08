import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {
  HttpErrors,
  Response,
  RestBindings,
  get,
  getModelSchemaRef,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings, securityId} from '@loopback/security';
import {
  CreateAccountRequestDto,
  LoginDto,
  NewAccountDto,
  TokenDto,
} from '../dtos';
import {Account, Permissions} from '../models';
import {
  AccountCredentialsService,
  AccountService,
  ExtendedUserProfile,
  TokenService,
  TokenServiceBindings,
} from '../services';

export class AuthController {
  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected httpResponse: Response,
    @inject('services.AccountService')
    protected accountService: AccountService,
    @inject('services.AccountCredentialsService')
    protected accountCredentialsService: AccountCredentialsService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    protected jwtService: TokenService,
  ) {}

  @post('/auth/sign-up')
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
          schema: getModelSchemaRef(CreateAccountRequestDto),
        },
      },
    })
    createAccountRequest: CreateAccountRequestDto,
  ): Promise<Account> {
    // Creates the account into the database
    const savedAccount = await this.accountService.create(
      NewAccountDto.fromCreateAccountRequestDto(createAccountRequest),
    );

    // Creates the user credentials into the database
    const hashedPassword = await this.accountCredentialsService.hashPassword(
      createAccountRequest.password,
    );
    await this.accountCredentialsService.create({
      accountId: savedAccount.id,
      password: hashedPassword,
    });

    this.httpResponse.status(201);
    return savedAccount;
  }

  @post('/auth/login')
  @response(200, {
    description: 'Request a JWT by giving the account credentials',
    content: {
      'application/json': {
        schema: getModelSchemaRef(TokenDto),
      },
    },
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(LoginDto),
        },
      },
    })
    credentials: LoginDto,
  ): Promise<TokenDto> {
    // Create the error when email or password do not match
    const wrongCredentialsError = new HttpErrors[400](
      'Incorrect username or password',
    );

    // Find the account using the given username
    const {username, password} = credentials;
    const account = await this.accountService.findByUsername(username);

    // Throw the error if no account was found
    if (account === null) {
      throw wrongCredentialsError;
    }

    // Search the related account credentials and throw and error if not found
    const accountCredentials =
      await this.accountCredentialsService.findByAccountId(account.id);
    if (accountCredentials === null) {
      throw new HttpErrors[404]('User credentials not found');
    }

    // Compare the stored password against the given password
    const isValidPassword = await this.accountCredentialsService.verifyPassword(
      password,
      accountCredentials.password,
    );
    // Throw the error if the passwords do not match
    if (!isValidPassword) {
      throw wrongCredentialsError;
    }

    // Generate the user permissions
    const permission: Permissions = account.isEmailVerified
      ? Permissions.REGULAR
      : Permissions.REQUEST_EMAIL_VERIFICATION;
    // Generate the user profile
    const userProfile = this.accountService.convertToUserProfile(
      account,
      permission,
    );

    // Generate the token
    const token = await this.jwtService.generateToken(userProfile);
    return {token};
  }

  @authenticate('jwt')
  @authorize({
    deniedRoles: [Permissions.RECOVER_PASSWORD, Permissions.VERIFY_EMAIL],
  })
  @get('/auth/who-am-i')
  @response(200, {
    description: 'Return the account information',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Account),
      },
    },
  })
  async whoAmI(
    @inject(SecurityBindings.USER) currentUser: ExtendedUserProfile,
  ): Promise<Account> {
    const account = await this.accountService.findById(currentUser[securityId]);
    if (account === null) {
      throw new HttpErrors[404]('No account was found');
    }

    return account;
  }
}
