import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  AccountCredentials,
  Account,
} from '../models';
import {AccountCredentialsRepository} from '../repositories';

export class AccountCredentialsAccountController {
  constructor(
    @repository(AccountCredentialsRepository)
    public accountCredentialsRepository: AccountCredentialsRepository,
  ) { }

  @get('/account-credentials/{id}/account', {
    responses: {
      '200': {
        description: 'Account belonging to AccountCredentials',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Account)},
          },
        },
      },
    },
  })
  async getAccount(
    @param.path.string('id') id: typeof AccountCredentials.prototype.id,
  ): Promise<Account> {
    return this.accountCredentialsRepository.account_credentials(id);
  }
}
