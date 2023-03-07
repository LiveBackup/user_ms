import {
  repository
} from '@loopback/repository';
import {AccountRepository} from '../repositories';

export class AccountAccountCredentialsController {
  constructor(
    @repository(AccountRepository) protected accountRepository: AccountRepository,
  ) { }
}
