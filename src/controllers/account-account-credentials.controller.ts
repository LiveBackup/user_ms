import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Account,
  AccountCredentials,
} from '../models';
import {AccountRepository} from '../repositories';

export class AccountAccountCredentialsController {
  constructor(
    @repository(AccountRepository) protected accountRepository: AccountRepository,
  ) { }

  @get('/accounts/{id}/account-credentials', {
    responses: {
      '200': {
        description: 'Account has one AccountCredentials',
        content: {
          'application/json': {
            schema: getModelSchemaRef(AccountCredentials),
          },
        },
      },
    },
  })
  async get(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<AccountCredentials>,
  ): Promise<AccountCredentials> {
    return this.accountRepository.account_credentials(id).get(filter);
  }

  @post('/accounts/{id}/account-credentials', {
    responses: {
      '200': {
        description: 'Account model instance',
        content: {'application/json': {schema: getModelSchemaRef(AccountCredentials)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Account.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccountCredentials, {
            title: 'NewAccountCredentialsInAccount',
            exclude: ['id'],
            optional: ['account_id']
          }),
        },
      },
    }) accountCredentials: Omit<AccountCredentials, 'id'>,
  ): Promise<AccountCredentials> {
    return this.accountRepository.account_credentials(id).create(accountCredentials);
  }

  @patch('/accounts/{id}/account-credentials', {
    responses: {
      '200': {
        description: 'Account.AccountCredentials PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccountCredentials, {partial: true}),
        },
      },
    })
    accountCredentials: Partial<AccountCredentials>,
    @param.query.object('where', getWhereSchemaFor(AccountCredentials)) where?: Where<AccountCredentials>,
  ): Promise<Count> {
    return this.accountRepository.account_credentials(id).patch(accountCredentials, where);
  }

  @del('/accounts/{id}/account-credentials', {
    responses: {
      '200': {
        description: 'Account.AccountCredentials DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(AccountCredentials)) where?: Where<AccountCredentials>,
  ): Promise<Count> {
    return this.accountRepository.account_credentials(id).delete(where);
  }
}
