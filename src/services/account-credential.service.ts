import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {compare, genSalt, hash} from 'bcryptjs';
import {AccountCredentials} from '../models';
import {AccountCredentialsRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountCredentialsService {
  constructor(
    @repository(AccountCredentialsRepository)
    protected accountCredentialsRepository: AccountCredentialsRepository,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return hash(password, await genSalt());
  }

  async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return compare(password, hashedPassword);
  }

  async create(
    newCrendentials: AccountCredentials,
  ): Promise<AccountCredentials> {
    return this.accountCredentialsRepository.create(newCrendentials);
  }

  async findById(credentialsId: string): Promise<AccountCredentials | null> {
    try {
      return await this.accountCredentialsRepository.findById(credentialsId);
    } catch (_) {
      return null;
    }
  }

  async findByAccountId(accountId: string): Promise<AccountCredentials | null> {
    return this.accountCredentialsRepository.findOne({
      where: {
        accountId: accountId,
      },
    });
  }

  async updateById(
    credentialsId: string,
    newData: Partial<AccountCredentials>,
  ): Promise<AccountCredentials | null> {
    const credentials = await this.findById(credentialsId);
    if (!credentials) return null;

    await this.accountCredentialsRepository.updateById(credentialsId, newData);
    return this.findById(credentialsId);
  }
}
