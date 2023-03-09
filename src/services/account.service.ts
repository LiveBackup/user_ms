import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Account} from '../models';
import {AccountRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountService {
  constructor(
    @repository(AccountRepository) protected accountRepository: AccountRepository,
  ) { }

  async create(newAccount: Account): Promise<Account> {
    return this.accountRepository.create(newAccount);
  }

  async existByEmailOrUsername(email: string, username: string): Promise<boolean> {
    const account = await this.accountRepository.findOne({
      where: {
        or: [
          {email},
          {username},
        ],
      },
      fields: {id: true},
    });

    return account !== null;
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.accountRepository.findOne({where: {email}});
  }

  async findByUsername(username: string): Promise<Account | null> {
    return this.accountRepository.findOne({where: {username}});
  }
}
