import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject, intercept} from '@loopback/core';
import {patch, post, response} from '@loopback/rest';
import {SecurityBindings} from '@loopback/security';
import {TokenInterceptor} from '../interceptors';
import {Account, ExtendedUserProfile, Permission} from '../models';
import {
  AccountService,
  TasksQueuesService,
  TokenService,
  TokenServiceBindings,
} from '../services';
import {VerifyEmail200ResponseOptions} from './options';

@authenticate('jwt')
export class AccountController {
  constructor(
    @inject('services.AccountService')
    protected accountService: AccountService,
    @inject('services.TasksQueuesService')
    protected tasksQueuesService: TasksQueuesService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    protected jwtService: TokenService,
  ) {}

  @authorize({allowedRoles: [Permission.REQUEST_EMAIL_VERIFICATION]})
  @post('/account/request-email-verification')
  @response(204)
  async requestEmailVerification(
    @inject(SecurityBindings.USER) currentUser: ExtendedUserProfile,
  ): Promise<void> {
    // Generate the user profile to request the email verification
    const userProfile = await this.accountService.getEmailVerificationProfile(
      currentUser,
    );

    // Generate the email verification token
    const emailVerificationToken = await this.jwtService.generateToken(
      userProfile,
    );

    // Enqueue the verification email delivery
    await this.tasksQueuesService.enqueueVerificationEmail(
      userProfile,
      emailVerificationToken,
    );
  }

  @authorize({allowedRoles: [Permission.VERIFY_EMAIL]})
  @intercept(TokenInterceptor.BINDING_KEY)
  @patch('/account/verify-email')
  @response(200, VerifyEmail200ResponseOptions)
  async verifyEmail(
    @inject(SecurityBindings.USER) requester: ExtendedUserProfile,
  ): Promise<Account> {
    return this.accountService.verifyAccountEmailAddress(requester);
  }
}
