import {BindingKey, BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId} from '@loopback/security';
import {compare, genSalt, hash} from 'bcryptjs';
import {ExtendedUserProfile, UpdatePassword} from '../models';
import {
  AccountCredentialsLb4Repository,
  IAccountCredentialsRepository,
} from '../repositories';

export namespace AccountCredentialsServiceBindings {
  export const SERVICE = BindingKey.create<AccountCredentialsService>(
    'services.AccountCredentialsService',
  );
}

@injectable({
  scope: BindingScope.SINGLETON,
  tags: [AccountCredentialsServiceBindings.SERVICE],
})
export class AccountCredentialsService {
  constructor(
    @repository(AccountCredentialsLb4Repository)
    protected readonly credentialsRepository: IAccountCredentialsRepository,
  ) {}

  async updatePassword(
    profile: ExtendedUserProfile,
    newPassword: UpdatePassword,
  ): Promise<void> {
    // Search the credentials using the account id
    const credentials = await this.credentialsRepository.findOneByAccountId(
      profile[securityId],
    );
    if (!credentials) {
      throw new HttpErrors[404]('The account credentials were not found');
    }

    // Check if the new password match with the old one
    const {password} = newPassword;
    const oldPasswordMatch = await compare(password, credentials.password);
    if (oldPasswordMatch) {
      const message = 'The new password can not be equal to old password';
      throw new HttpErrors[400](message);
    }

    // Update the credentials
    await this.credentialsRepository.updateCredentialsById(credentials.id, {
      password: await hash(password, await genSalt()),
    });
  }
}
