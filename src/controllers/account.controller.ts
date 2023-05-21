import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {
  HttpErrors,
  post,
  Response,
  response,
  RestBindings,
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {
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
    @inject('services.TasksQueuesService')
    protected tasksQueuesService: TasksQueuesService,
    @inject(CustomTokenServiceBindings.TOKEN_SERVICE)
    protected jwtService: CustomTokenService,
  ) {}

  @authenticate('jwt')
  @authorize({allowedRoles: [Permissions.REQUEST_EMAIL_VERIFICATION]})
  @post('/account/request-email-verification')
  @response(204)
  async requestEmailVerification(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ) {
    const account = await this.accountService.findById(currentUser[securityId]);
    if (account === null) {
      throw new HttpErrors[404]('No account was found');
    } else if (account.isEmailVerified) {
      throw new HttpErrors[400]('Emails has already been verified');
    }

    const userProfile = this.accountService.convertToUserProfile(account, [
      Permissions.VERIFY_EMAIL,
    ]);
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
      throw new HttpErrors[500]('Could not add the task to the queue');
    }
  }
}
