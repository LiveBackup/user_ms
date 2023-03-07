import {
  repository
} from '@loopback/repository';
import {AccountCredentialsRepository} from '../repositories';

export class AccountCredentialsAccountController {
  constructor(
    @repository(AccountCredentialsRepository)
    public accountCredentialsRepository: AccountCredentialsRepository,
  ) { }
}
