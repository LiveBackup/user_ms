import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  HasOneRepositoryFactory,
  repository,
} from '@loopback/repository';
import {UserDbDataSource} from '../../datasources';
import {Account, NewAccount} from '../../models';
import {IAccountRepository} from '../iaccount.repository';
import {AccountCredentialsLb4Repository} from './account-credentials.repository';
import {
  AccountCredentialsEntity,
  AccountEntity,
  AccountRelations,
  TokenEntity,
} from './entities';
import {TokenLb4Repository} from './token.repository';

export class AccountLb4Repository
  extends DefaultCrudRepository<
    AccountEntity,
    typeof AccountEntity.prototype.id,
    AccountRelations
  >
  implements IAccountRepository
{
  public readonly accountCredentials: HasOneRepositoryFactory<
    AccountCredentialsEntity,
    typeof AccountEntity.prototype.id
  >;

  public readonly tokens: HasManyRepositoryFactory<
    TokenEntity,
    typeof AccountEntity.prototype.id
  >;

  constructor(
    @inject('datasources.user_db') dataSource: UserDbDataSource,
    @repository.getter('AccountCredentialsLb4Repository')
    protected accountCredentialsRepositoryGetter: Getter<AccountCredentialsLb4Repository>,
    @repository.getter('TokenLb4Repository')
    protected tokenRepositoryGetter: Getter<TokenLb4Repository>,
  ) {
    super(AccountEntity, dataSource);
    this.tokens = this.createHasManyRepositoryFactoryFor(
      'tokens',
      tokenRepositoryGetter,
    );
    this.accountCredentials = this.createHasOneRepositoryFactoryFor(
      'accountCredentials',
      accountCredentialsRepositoryGetter,
    );
    this.registerInclusionResolver(
      'accountCredentials',
      this.accountCredentials.inclusionResolver,
    );
  }

  async createAccount(newAccount: NewAccount): Promise<Account> {
    const createdAccount = await this.create(newAccount);
    return createdAccount;
  }

  async findAccountById(id: string): Promise<Account | null> {
    try {
      return await this.findById(id);
    } catch (_) {
      return null;
    }
  }

  async findAccountByEmail(email: string): Promise<Account | null> {
    return this.findOne({where: {email}});
  }

  async findOneByEmailOrUsername(key: string): Promise<Account | null> {
    return this.findOne({
      where: {
        or: [{email: key}, {username: key}],
      },
      include: ['accountCredentials'],
    });
  }

  async findManyByEmailAndUsername(
    email: string,
    username: string,
  ): Promise<Account[]> {
    return this.find({
      where: {
        or: [{email}, {username}],
      },
    });
  }

  async updateAccountById(
    id: string,
    newData: Partial<NewAccount>,
  ): Promise<Account | null> {
    try {
      await this.updateById(id, newData);
      return await this.findAccountById(id);
    } catch (_) {
      return null;
    }
  }

  async deleteAccountById(id: string): Promise<Account | null> {
    const accountToDelete = await this.findAccountById(id);
    if (!accountToDelete) {
      return null;
    }

    await this.deleteById(id);
    return accountToDelete;
  }
}
