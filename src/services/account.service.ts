import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {compare, genSalt, hash} from 'bcryptjs';
import {AccountCredentialsRepository, AccountRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountService {
  constructor(
    @repository(AccountRepository) protected accountRepository: AccountRepository,
    @repository(AccountCredentialsRepository) protected accountCredentialsRepository: AccountCredentialsRepository,
  ) { }

  async hashPassword(password: string): Promise<string> {
    return hash(password, await genSalt());
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
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
}
