import {Credentials, NewCredentials} from '../models';

export interface IAccountCredentialsRepository {
  saveCredentials(credentials: NewCredentials): Promise<Credentials>;
  findOneByAccountId(accountId: string): Promise<Credentials | null>;
  updateCredentialsById(
    id: string,
    newData: Partial<NewCredentials>,
  ): Promise<void>;
  deleteCredentialsByAccountId(accountId: string): Promise<Credentials | null>;
}
