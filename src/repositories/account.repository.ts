import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasOneRepositoryFactory} from '@loopback/repository';
import {UserDbDataSource} from '../datasources';
import {Account, AccountRelations, AccountCredentials} from '../models';
import {AccountCredentialsRepository} from './account-credentials.repository';

export class AccountRepository extends DefaultCrudRepository<
  Account,
  typeof Account.prototype.id,
  AccountRelations
> {

  public readonly account_credentials: HasOneRepositoryFactory<AccountCredentials, typeof Account.prototype.id>;

  constructor(
    @inject('datasources.user_db') dataSource: UserDbDataSource, @repository.getter('AccountCredentialsRepository') protected accountCredentialsRepositoryGetter: Getter<AccountCredentialsRepository>,
  ) {
    super(Account, dataSource);
    this.account_credentials = this.createHasOneRepositoryFactoryFor('account_credentials', accountCredentialsRepositoryGetter);
  }
}
