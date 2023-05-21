import {inject} from '@loopback/core';
import {
  HttpErrors,
  Response,
  RestBindings,
  getModelSchemaRef,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {Account} from '../models';
import {
  AccountService,
  CustomTokenService,
  CustomTokenServiceBindings,
  Permissions,
  TasksQueuesService,
} from '../services';

export class AccountCredentialsController {
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

  @post('/credentials/request-password-recovery')
  @response(204)
  async requestPasswordRecovery(
    @requestBody({
      description: 'Email to send the recovery token',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Account, {
            exclude: ['id', 'isEmailVerified', 'username', 'registeredAt'],
          }),
        },
      },
    })
    recoveryRequest: Account,
  ): Promise<void> {
    const {email} = recoveryRequest;
    // Verify if the email is registered
    const account = await this.accountService.findByEmail(email);
    if (!account) {
      throw new HttpErrors[404](
        'There is not an account registered with the given email',
      );
    }

    // Convert the related account to UserProfile
    const userProfile = this.accountService.convertToUserProfile(account, [
      Permissions.RECOVER_PASSWORD,
    ]);

    // Generate the recovery token
    const recoveryToken = await this.jwtService.generateToken(userProfile);
    // Enqueue the email delivery job
    const tasksStatus =
      await this.tasksQueuesService.enqueueRecoveryPasswordEmail(
        account.username,
        email,
        recoveryToken,
      );

    // Verify if the tasks was enqueued
    if (!tasksStatus) {
      throw new HttpErrors[500]('Could not add the task to the queue');
    }

    this.httpResponse.status(204);
  }
}
