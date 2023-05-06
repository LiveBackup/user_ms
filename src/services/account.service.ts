import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {securityId} from '@loopback/security';
import {Account} from '../models';
import {AccountRepository} from '../repositories';
import {ExtendedUserProfile, Permissions} from './custom-token.service';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountService {
  constructor(
    @repository(AccountRepository)
    protected accountRepository: AccountRepository,
  ) {}

  convertToUserProfile(
    account: Account,
    permissions: Permissions[],
  ): ExtendedUserProfile {
    return {
      [securityId]: account.id,
      username: account.username,
      email: account.email,
      permissions,
    };
  }

  async create(newAccount: Account): Promise<Account> {
    return this.accountRepository.create(newAccount);
  }

  async existByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<boolean> {
    const account = await this.accountRepository.findOne({
      where: {
        or: [{email}, {username}],
      },
      fields: {id: true},
    });

    return account !== null;
  }

  async findById(id: string): Promise<Account | null> {
    try {
      return await this.accountRepository.findById(id);
    } catch (_) {
      return null;
    }
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.accountRepository.findOne({where: {email}});
  }

  async findByUsername(username: string): Promise<Account | null> {
    return this.accountRepository.findOne({where: {username}});
  }
}
