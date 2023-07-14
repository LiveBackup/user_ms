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
import {SecurityBindings, UserProfile, securityId} from '@loopback/security';
import {Account, AccountCredentials} from '../models';
import {Credentials, NewAccount, TokenResponse} from '../schemas';
import {
  AccountCredentialsService,
  AccountService,
  CustomTokenService,
  CustomTokenServiceBindings,
  Permissions,
} from '../services';

export class AuthController {
  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected httpResponse: Response,
    @inject('services.AccountService')
    protected accountService: AccountService,
    @inject('services.AccountCredentialsService')
    protected accountCredentialsService: AccountCredentialsService,
    @inject(CustomTokenServiceBindings.TOKEN_SERVICE)
    protected jwtService: CustomTokenService,
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
          schema: getModelSchemaRef(NewAccount),
        },
      },
    })
    newAccountRequest: NewAccount,
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
      new Account({
        email,
        username,
        registeredAt: new Date(),
      }),
    );

    // Creates the user credentials into the database
    await this.accountCredentialsService.create(
      new AccountCredentials({
        accountId: newAccount.id,
        password: await this.accountCredentialsService.hashPassword(password),
      }),
    );

    this.httpResponse.status(201);
    return newAccount;
  }

  @post('/auth/login')
  @response(200, {
    description: 'Request a JWT by giving the account credentials',
    content: {
      'application/json': {
        schema: getModelSchemaRef(TokenResponse),
      },
    },
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Credentials),
        },
      },
    })
    credentials: Credentials,
  ): Promise<TokenResponse> {
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

    // Compare the stored password againts the given password
    const isValidPassowrd = await this.accountCredentialsService.verifyPassword(
      password,
      accountCredentials.password,
    );
    // Throw the error if the passwords do not match
    if (!isValidPassowrd) {
      throw wrongCredentialsError;
    }

    // Generate the user permissions
    const permissions: Permissions[] = [Permissions.REGULAR];
    // If hte email has not been verified then add the permission
    // to request the verification
    if (!account.isEmailVerified) {
      permissions.push(Permissions.REQUEST_EMAIL_VERIFICATION);
    }
    // Generate the user profile
    const userProfile = this.accountService.convertToUserProfile(
      account,
      permissions,
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
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<Account> {
    const account = await this.accountService.findById(currentUser[securityId]);
    if (account === null) {
      throw new HttpErrors[404]('No account was found');
    }

    return account;
  }
}
