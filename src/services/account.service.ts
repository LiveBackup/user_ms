import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId} from '@loopback/security';
import {compare, genSalt, hash} from 'bcryptjs';
import {
  Account,
  ExtendedUserProfile,
  LoginRequest,
  NewAccountRequest,
  PasswordRecoveryRequest,
  Permissions,
  UserProfileRequest,
} from '../models';
import {
  AccountCredentialsLb4Repository,
  AccountLb4Repository,
  IAccountCredentialsRepository,
  IAccountRepository,
} from '../repositories';

@injectable({scope: BindingScope.SINGLETON})
export class AccountService {
  constructor(
    @repository(AccountLb4Repository)
    protected readonly accountRepository: IAccountRepository,
    @repository(AccountCredentialsLb4Repository)
    protected readonly credentialsRepository: IAccountCredentialsRepository,
  ) {}

  convertToUserProfile(
    account: Account,
    permission: Permissions,
  ): UserProfileRequest {
    return {
      [securityId]: account.id,
      username: account.username,
      email: account.email,
      requestedPermission: permission,
    };
  }

  async createUserAccount(
    newAccountRequest: NewAccountRequest,
  ): Promise<Account> {
    const {email, username, password} = newAccountRequest;

    // Verify if the given email and username are available
    const existingAccounts =
      await this.accountRepository.findManyByEmailAndUsername(email, username);
    if (existingAccounts.length > 0) {
      const errorMessage =
        existingAccounts[0].email === email
          ? 'There already exists an Account with the given email'
          : 'There already exists an Account with the given username';

      throw new HttpErrors[400](errorMessage);
    }

    // Saves the account into the database
    const createdAccount = await this.accountRepository.createAccount({
      email,
      username,
      isEmailVerified: false,
      registeredAt: new Date(),
    });

    // Saves the user credentials into the database
    await this.credentialsRepository.saveCredentials({
      accountId: createdAccount.id,
      password: await hash(password, await genSalt()),
    });

    return createdAccount;
  }

  async loginUser(loginRequest: LoginRequest): Promise<UserProfileRequest> {
    // Create the error when email or password do not match
    const wrongCredentialsError = new HttpErrors[400](
      'Incorrect username or password',
    );

    // Find the account using the given username
    const {usernameOrEmail: key, password} = loginRequest;
    const account = await this.accountRepository.findOneByEmailOrUsername(key);

    // Throw the error if no account was found
    if (account === null) {
      throw wrongCredentialsError;
    }

    // Search the related account credentials and throw and error if not found
    if (account.accountCredentials === undefined) {
      throw new HttpErrors[404]('User credentials not found');
    }

    // Compare the stored password against the given password
    const hashedPassword = account.accountCredentials.password;
    const isValidPassword = await compare(password, hashedPassword);
    if (!isValidPassword) {
      throw wrongCredentialsError;
    }

    // Generate the user permissions
    const permission: Permissions = account.isEmailVerified
      ? Permissions.REGULAR
      : Permissions.REQUEST_EMAIL_VERIFICATION;
    // Generate the user profile
    const userProfileRequest = this.convertToUserProfile(account, permission);

    return userProfileRequest;
  }

  async findWithUserProfile(
    userProfile: ExtendedUserProfile,
  ): Promise<Account> {
    const account = await this.accountRepository.findAccountById(
      userProfile[securityId],
    );
    if (account === null) {
      throw new HttpErrors[404]('No account was found');
    }

    return account;
  }

  async getEmailVerificationProfile(
    activeProfile: ExtendedUserProfile,
  ): Promise<UserProfileRequest> {
    const account = await this.findWithUserProfile(activeProfile);
    if (account.isEmailVerified) {
      throw new HttpErrors[400]('Email has already been verified');
    }

    return this.convertToUserProfile(account, Permissions.VERIFY_EMAIL);
  }

  async verifyAccountEmailAddress(
    profile: ExtendedUserProfile,
  ): Promise<Account> {
    const updatedAccount = await this.accountRepository.updateAccountById(
      profile[securityId],
      {isEmailVerified: true},
    );
    if (!updatedAccount) {
      throw new HttpErrors[404]('The account was not found');
    }

    return updatedAccount;
  }

  async getPasswordRecoveryProfile(
    passwordRecoveryRequest: PasswordRecoveryRequest,
  ): Promise<UserProfileRequest> {
    const {email} = passwordRecoveryRequest;
    const account = await this.accountRepository.findAccountByEmail(email);
    if (!account) {
      const message = `There is not an account with the email ${email}`;
      throw new HttpErrors[404](message);
    }

    return this.convertToUserProfile(account, Permissions.RECOVER_PASSWORD);
  }
}
