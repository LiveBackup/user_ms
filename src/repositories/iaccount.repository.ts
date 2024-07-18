import {Account, NewAccount} from '../models';

export interface IAccountRepository {
  createAccount(account: NewAccount): Promise<Account>;
  findAccountById(id: string): Promise<Account | null>;
  findAccountByEmail(email: string): Promise<Account | null>;
  findOneByEmailOrUsername(key: string): Promise<Account | null>;
  findManyByEmailAndUsername(
    email: string,
    username: string,
  ): Promise<Account[]>;
  updateAccountById(
    id: string,
    newData: Partial<NewAccount>,
  ): Promise<Account | null>;
  deleteAccountById(id: string): Promise<Account | null>;
}
