import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId} from '@loopback/security';
import {NewAccountDto} from '../dtos';
import {Account, Permissions} from '../models';
import {AccountRepository} from '../repositories';
import {RequestUserProfile} from './token.service';

@injectable({scope: BindingScope.SINGLETON})
export class AccountService {
  constructor(
    @repository(AccountRepository)
    protected accountRepository: AccountRepository,
  ) {}

  convertToUserProfile(
    account: Account,
    permission: Permissions,
  ): RequestUserProfile {
    return {
      [securityId]: account.id,
      username: account.username,
      email: account.email,
      permission: permission,
    };
  }

  private async verifyUniqueEntries(newAccount: NewAccountDto): Promise<void> {
    // Find one account that match with either email or username
    const existingAccount = await this.accountRepository.findOne({
      where: {
        or: [{email: newAccount.email}, {username: newAccount.username}],
      },
    });

    // If no accounts were found then continue
    if (!existingAccount) return;

    let key: string, value: string;
    if (newAccount.email === existingAccount.email)
      [key, value] = ['email', newAccount.email];
    else [key, value] = ['username', newAccount.username];

    throw new HttpErrors[400](`Duplicated (${key}) with value (${value})`);
  }

  async create(newAccount: NewAccountDto): Promise<Account> {
    await this.verifyUniqueEntries(newAccount);
    return this.accountRepository.create(newAccount);
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

  async updateById(
    id: string,
    newInfo: Partial<Account>,
  ): Promise<Account | null> {
    try {
      await this.accountRepository.updateById(id, newInfo);
    } catch (_) {
      return null;
    }
    return this.findById(id);
  }
}
