import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {
  getModelSchemaRef,
  HttpErrors,
  patch,
  post,
  Response,
  response,
  RestBindings,
} from '@loopback/rest';
import {SecurityBindings, securityId} from '@loopback/security';
import {Account, Permissions} from '../models';
import {
  AccountService,
  ExtendedUserProfile,
  TasksQueuesService,
  TokenService,
  TokenServiceBindings,
} from '../services';

export class AccountController {
  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected httpResponse: Response,
    @inject('services.AccountService')
    protected accountService: AccountService,
    @inject('services.TasksQueuesService')
    protected tasksQueuesService: TasksQueuesService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    protected jwtService: TokenService,
  ) {}

  @authenticate('jwt')
  @authorize({allowedRoles: [Permissions.REQUEST_EMAIL_VERIFICATION]})
  @post('/account/request-email-verification')
  @response(200, {
    description: 'Send a email with a token to verify a user email',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Account),
      },
    },
  })
  async requestEmailVerification(
    @inject(SecurityBindings.USER) currentUser: ExtendedUserProfile,
  ): Promise<Account> {
    const account = await this.accountService.findById(currentUser[securityId]);
    if (!account)
      throw new HttpErrors[404]('The requested account does not exists');
    else if (account.isEmailVerified)
      throw new HttpErrors[400]('Emails has already been verified');

    // Create the user profile
    const userProfile = this.accountService.convertToUserProfile(
      account,
      Permissions.VERIFY_EMAIL,
    );
    // Generate the token
    const emailVerificationToken = await this.jwtService.generateToken(
      userProfile,
    );

    // Enqueue the verification email delivery
    const tasksStatus = await this.tasksQueuesService.enqueueVerificationEmail(
      account.username,
      account.email,
      emailVerificationToken,
    );

    if (!tasksStatus)
      throw new HttpErrors[500]('Could not add the task to the queue');

    return account;
  }

  @authenticate('jwt')
  @authorize({allowedRoles: [Permissions.VERIFY_EMAIL]})
  @patch('/account/verify-email')
  @response(200, {
    description: 'Account info with email verified',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Account),
      },
    },
  })
  async verifyEmail(
    @inject(SecurityBindings.USER) requester: ExtendedUserProfile,
  ): Promise<Account> {
    const updatedAccount = await this.accountService.updateById(
      requester[securityId],
      {isEmailVerified: true},
    );
    if (!updatedAccount)
      throw new HttpErrors[404]('The requester account was not found');

    return updatedAccount;
  }
}
