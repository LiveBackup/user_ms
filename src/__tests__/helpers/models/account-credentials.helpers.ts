import {Credentials} from '../../../models';

export const givenAccountCredentials = function (
  data?: Partial<Credentials>,
): Credentials {
  return Object.assign(
    {
      id: '5857d4ec-c384-4ab6-9df8-4739e7a4b34f',
      password: 'password',
      accountId: '44cdb68c-4c45-4e47-8da3-5e6c7fc5f225',
    },
    data,
  ) as Credentials;
};
