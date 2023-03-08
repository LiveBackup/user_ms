import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {AccountRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountService {
  constructor(
    @repository(AccountRepository) protected accountRepository: AccountRepository,
  ) { }

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
