import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {
  Response,
  RestBindings,
  get,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings} from '@loopback/security';
import {AccountDto, LoginRequestDto, NewAccountDto, TokenDto} from '../dtos';
import {ExtendedUserProfile, Permissions} from '../models';
import {AccountService, TokenService, TokenServiceBindings} from '../services';
import {
  Login200ResponseOptions,
  LoginRequestBodyOptions,
  SignUp201ResponseOptions,
  SignUpRequestBodyOptions,
  WhoAmI200ResponseOptions,
} from './options';

export class AuthController {
  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected httpResponse: Response,
    @inject('services.AccountService')
    protected accountService: AccountService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    protected jwtService: TokenService,
  ) {}

  @post('/auth/sign-up')
  @response(201, SignUp201ResponseOptions)
  async signup(
    @requestBody(SignUpRequestBodyOptions)
    newAccountRequest: NewAccountDto,
  ): Promise<AccountDto> {
    const account = await this.accountService.createUserAccount(
      newAccountRequest,
    );

    this.httpResponse.status(201);
    return account;
  }

  @post('/auth/login')
  @response(200, Login200ResponseOptions)
  async login(
    @requestBody(LoginRequestBodyOptions)
    loginRequest: LoginRequestDto,
  ): Promise<TokenDto> {
    const userProfile = await this.accountService.loginUser(loginRequest);

    // Generate the token
    const token = await this.jwtService.generateToken(userProfile);
    return {token};
  }

  @authenticate('jwt')
  @authorize({
    deniedRoles: [Permissions.RECOVER_PASSWORD, Permissions.VERIFY_EMAIL],
  })
  @get('/auth/who-am-i')
  @response(200, WhoAmI200ResponseOptions)
  async whoAmI(
    @inject(SecurityBindings.USER) currentUser: ExtendedUserProfile,
  ): Promise<AccountDto> {
    return this.accountService.findWithUserProfile(currentUser);
  }
}
