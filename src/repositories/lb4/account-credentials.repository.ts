import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  repository,
} from '@loopback/repository';
import {UserDbDataSource} from '../../datasources';
import {Credentials, NewCredentials} from '../../models';
import {IAccountCredentialsRepository} from '../iaccount-credentials.repository';
import {AccountLb4Repository} from './account.repository';
import {
  AccountCredentialsEntity,
  AccountCredentialsRelations,
  AccountEntity,
} from './entities';

export class AccountCredentialsLb4Repository
  extends DefaultCrudRepository<
    AccountCredentialsEntity,
    typeof AccountCredentialsEntity.prototype.id,
    AccountCredentialsRelations
  >
  implements IAccountCredentialsRepository
{
  public readonly accountCredentials: BelongsToAccessor<
    AccountEntity,
    typeof AccountCredentialsEntity.prototype.id
  >;

  constructor(
    @inject('datasources.user_db') dataSource: UserDbDataSource,
    @repository.getter('AccountLb4Repository')
    protected accountRepositoryGetter: Getter<AccountLb4Repository>,
  ) {
    super(AccountCredentialsEntity, dataSource);
    this.accountCredentials = this.createBelongsToAccessorFor(
      'account',
      accountRepositoryGetter,
    );
    this.registerInclusionResolver(
      'account',
      this.accountCredentials.inclusionResolver,
    );
  }

  async saveCredentials(credentials: NewCredentials): Promise<Credentials> {
    return this.create(credentials);
  }

  async findOneByAccountId(accountId: string): Promise<Credentials | null> {
    return this.findOne({where: {accountId}});
  }

  async updateCredentialsById(
    id: string,
    newData: Partial<NewCredentials>,
  ): Promise<void> {
    return this.updateById(id, newData);
  }

  async deleteCredentialsByAccountId(
    accountId: string,
  ): Promise<Credentials | null> {
    const credentialsToDelete = await this.findOneByAccountId(accountId);
    if (!credentialsToDelete) {
      return null;
    }

    await this.deleteById(credentialsToDelete.id);
    return credentialsToDelete;
  }
}
