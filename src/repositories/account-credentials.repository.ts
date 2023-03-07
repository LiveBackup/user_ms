import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {UserDbDataSource} from '../datasources';
import {Account, AccountCredentials, AccountCredentialsRelations} from '../models';
import {AccountRepository} from './account.repository';

/* eslint-disable @typescript-eslint/naming-convention */
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
