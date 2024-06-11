import {Account} from '../../../models';

export const givenAccount = function (data?: Partial<Account>): Account {
  return Object.assign(
    {
      id: '44cdb68c-4c45-4e47-8da3-5e6c7fc5f225',
      username: 'mock_user_123',
      email: 'mockuser123@mock.com',
      isEmailVerified: false,
      registeredAt: new Date(),
    },
    data,
  ) as Account;
};
