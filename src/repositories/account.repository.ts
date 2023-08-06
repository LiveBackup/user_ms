import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  HasOneRepositoryFactory,
  repository
} from '@loopback/repository';
import {UserDbDataSource} from '../datasources';
import {Account, AccountCredentials, AccountRelations, Token} from '../models';
import {AccountCredentialsRepository} from './account-credentials.repository';
import {TokenRepository} from './token.repository';

export class AccountRepository extends DefaultCrudRepository<
  Account,
  typeof Account.prototype.id,
  AccountRelations
> {
  public readonly accountCredentials: HasOneRepositoryFactory<
    AccountCredentials,
    typeof Account.prototype.id
  >;

  public readonly tokens: HasManyRepositoryFactory<Token, typeof Account.prototype.id>;

  constructor(
    @inject('datasources.user_db') dataSource: UserDbDataSource,
    @repository.getter('AccountCredentialsRepository')
    protected accountCredentialsRepositoryGetter: Getter<AccountCredentialsRepository>, @repository.getter('TokenRepository') protected tokenRepositoryGetter: Getter<TokenRepository>,
  ) {
    super(Account, dataSource);
    this.tokens = this.createHasManyRepositoryFactoryFor('tokens', tokenRepositoryGetter);
    this.accountCredentials = this.createHasOneRepositoryFactoryFor(
      'accountCredentials',
      accountCredentialsRepositoryGetter,
    );
  }
}
