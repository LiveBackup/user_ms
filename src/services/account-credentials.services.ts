import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {compare, genSalt, hash} from 'bcryptjs';
import {AccountCredentialsRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountCredentialsService {
  constructor(
    @repository(AccountCredentialsRepository) protected accountCredentialsRepository: AccountCredentialsRepository,
  ) { }

  async hasPassword(password: string): Promise<string> {
    return hash(password, await genSalt());
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
  }
}
