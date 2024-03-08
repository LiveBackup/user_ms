import {CreateAccountRequestDto} from './requests';

export class NewAccountDto {
  readonly username: string;
  readonly email: string;
  readonly registeredAt: Date;

  constructor(username: string, email: string) {
    this.username = username;
    this.email = email;
    this.registeredAt = new Date();
  }

  static fromCreateAccountRequestDto(
    createAccountRequestDto: CreateAccountRequestDto,
  ): NewAccountDto {
    const {username, email} = createAccountRequestDto;
    return new NewAccountDto(username, email);
  }
}
