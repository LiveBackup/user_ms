import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {
  HttpErrors,
  Response,
  RestBindings,
  getModelSchemaRef,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings, securityId} from '@loopback/security';
import {Account, AccountCredentials, Permissions} from '../models';
import {Password} from '../schemas';
import {
  AccountCredentialsService,
  AccountService,
  ExtendedUserProfile,
  TasksQueuesService,
  TokenService,
  TokenServiceBindings,
} from '../services';

export class AccountCredentialsController {
  constructor(
    @inject(RestBindings.Http.RESPONSE)
    protected httpResponse: Response,
    @inject('services.AccountService')
    protected accountService: AccountService,
    @inject('services.AccountCredentialsService')
    protected accountCredentialsService: AccountCredentialsService,
    @inject('services.TasksQueuesService')
    protected tasksQueuesService: TasksQueuesService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    protected jwtService: TokenService,
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
      await this.tasksQueuesService.enqueuePasswordRecoveryEmail(
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

  @authenticate('jwt')
  @authorize({
    allowedRoles: [Permissions.REGULAR, Permissions.RECOVER_PASSWORD],
  })
  @patch('/credentials/update-password')
  @response(204)
  async updatePassword(
    @inject(SecurityBindings.USER) requester: ExtendedUserProfile,
    @requestBody({
      description: 'New password',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Password),
        },
      },
    })
    newPassword: Password,
  ): Promise<void> {
    const {password} = newPassword;
    // Search the credentials using the account id
    const credentials = await this.accountCredentialsService.findByAccountId(
      requester[securityId],
    );
    if (!credentials)
      throw new HttpErrors[404]('The account credentials were not found');

    // Check if the new password match with the current one
    const passwordMatch = await this.accountCredentialsService.verifyPassword(
      password,
      credentials.password,
    );
    if (passwordMatch)
      throw new HttpErrors[400](
        'The new password can not be equal to current password',
      );

    // Update and return the new account credentials
    const newCredentials: Partial<AccountCredentials> = {
      password: await this.accountCredentialsService.hashPassword(password),
    };
    await this.accountCredentialsService.updateById(
      credentials.id,
      newCredentials,
    );

    this.httpResponse.status(204);
  }
}
