import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject, intercept} from '@loopback/core';
import {
  Response,
  RestBindings,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings} from '@loopback/security';
import {PasswordRecoveryRequestDto, UpdatePasswordDto} from '../dtos';
import {TokenInterceptor} from '../interceptors';
import {ExtendedUserProfile, Permissions} from '../models';
import {
  AccountCredentialsService,
  AccountCredentialsServiceBindings,
  AccountService,
  TasksQueuesService,
  TokenService,
  TokenServiceBindings,
} from '../services';
import {
  PasswordRecoveryRequestBodyOptions,
  UpdatePasswordRequestOptions,
} from './options';

export class AccountCredentialsController {
  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected httpResponse: Response,
    @inject('services.AccountService')
    protected accountService: AccountService,
    @inject(AccountCredentialsServiceBindings.SERVICE)
    protected accountCredentialsService: AccountCredentialsService,
    @inject('services.TasksQueuesService')
    protected tasksQueuesService: TasksQueuesService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    protected jwtService: TokenService,
  ) {}

  @post('/credentials/request-password-recovery')
  @response(204)
  async requestPasswordRecovery(
    @requestBody(PasswordRecoveryRequestBodyOptions)
    recoveryRequest: PasswordRecoveryRequestDto,
  ): Promise<void> {
    // Convert the related account to UserProfile
    const userProfile = await this.accountService.getPasswordRecoveryProfile(
      recoveryRequest,
    );

    // Generate the recovery token
    const recoveryToken = await this.jwtService.generateToken(userProfile);

    // Enqueue the email delivery job
    await this.tasksQueuesService.enqueuePasswordRecoveryEmail(
      userProfile,
      recoveryToken,
    );

    this.httpResponse.status(204);
  }

  @authenticate('jwt')
  @authorize({
    allowedRoles: [Permissions.REGULAR, Permissions.RECOVER_PASSWORD],
  })
  @intercept(TokenInterceptor.BINDING_KEY)
  @patch('/credentials/update-password')
  @response(204)
  async updatePassword(
    @inject(SecurityBindings.USER) requester: ExtendedUserProfile,
    @requestBody(UpdatePasswordRequestOptions)
    newPassword: UpdatePasswordDto,
  ): Promise<void> {
    await this.accountCredentialsService.updatePassword(requester, newPassword);
    this.httpResponse.status(204);
  }
}
