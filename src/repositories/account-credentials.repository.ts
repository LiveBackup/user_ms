import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {UserDbDataSource} from '../datasources';
import {AccountCredentials, AccountCredentialsRelations, Account} from '../models';
import {AccountRepository} from './account.repository';

export class AccountCredentialsRepository extends DefaultCrudRepository<
  AccountCredentials,
  typeof AccountCredentials.prototype.id,
  AccountCredentialsRelations
> {

  public readonly account_credentials: BelongsToAccessor<Account, typeof AccountCredentials.prototype.id>;

  constructor(
    @inject('datasources.user_db') dataSource: UserDbDataSource, @repository.getter('AccountRepository') protected accountRepositoryGetter: Getter<AccountRepository>,
  ) {
    super(AccountCredentials, dataSource);
    this.account_credentials = this.createBelongsToAccessorFor('account_credentials', accountRepositoryGetter,);
    this.registerInclusionResolver('account_credentials', this.account_credentials.inclusionResolver);
  }
}
