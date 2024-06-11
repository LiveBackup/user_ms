import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  repository,
} from '@loopback/repository';
import {UserDbDataSource} from '../../datasources';
import {NewToken, Token} from '../../models';
import {ITokenRepository} from '../itoken-repository';
import {AccountLb4Repository} from './account.repository';
import {AccountEntity, TokenEntity, TokenRelations} from './entities';

export class TokenLb4Repository
  extends DefaultCrudRepository<
    TokenEntity,
    typeof TokenEntity.prototype.id,
    TokenRelations
  >
  implements ITokenRepository
{
  public readonly account: BelongsToAccessor<
    AccountEntity,
    typeof TokenEntity.prototype.id
  >;

  constructor(
    @inject('datasources.user_db') dataSource: UserDbDataSource,
    @repository.getter('AccountLb4Repository')
    protected accountRepositoryGetter: Getter<AccountLb4Repository>,
  ) {
    super(TokenEntity, dataSource);
    this.account = this.createBelongsToAccessorFor(
      'account',
      accountRepositoryGetter,
    );
    this.registerInclusionResolver('account', this.account.inclusionResolver);
  }

  async createToken(token: NewToken): Promise<Token> {
    return this.create(token);
  }

  async findTokenById(id: string): Promise<Token | null> {
    try {
      return await this.findById(id);
    } catch (_) {
      return null;
    }
  }

  async deleteTokenById(id: string): Promise<Token | null> {
    const tokenToDelete = await this.findById(id);
    if (!tokenToDelete) {
      return null;
    }

    await this.deleteById(id);
    return tokenToDelete;
  }
}
