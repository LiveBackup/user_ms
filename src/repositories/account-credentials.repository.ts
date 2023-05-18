import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  repository,
} from '@loopback/repository';
import {UserDbDataSource} from '../datasources';
import {
  Account,
  AccountCredentials,
  AccountCredentialsRelations,
} from '../models';
import {AccountRepository} from './account.repository';

export class AccountCredentialsRepository extends DefaultCrudRepository<
  AccountCredentials,
  typeof AccountCredentials.prototype.id,
  AccountCredentialsRelations
> {
  public readonly accountCredentials: BelongsToAccessor<
    Account,
    typeof AccountCredentials.prototype.id
  >;

  constructor(
    @inject('datasources.user_db') dataSource: UserDbDataSource,
    @repository.getter('AccountRepository')
    protected accountRepositoryGetter: Getter<AccountRepository>,
  ) {
    super(AccountCredentials, dataSource);
    this.accountCredentials = this.createBelongsToAccessorFor(
      'accountCredentials',
      accountRepositoryGetter,
    );
    this.registerInclusionResolver(
      'accountCredentials',
      this.accountCredentials.inclusionResolver,
    );
  }
}
