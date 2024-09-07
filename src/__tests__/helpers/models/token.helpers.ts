import {
  Permission,
  UserProfile,
  UserProfileRequest,
} from '../../../models';

export const givenUserProfile = function (
  data?: Partial<UserProfile>,
): UserProfile {
  return Object.assign(
    {
      token:
        'c414d13e-74af-4fa6-85d8-a935edda4b37-7b74d046-5951-4211-a413-192d0303cf4d',
      isOneUsageProfile: false,
      permissions: [Permission.REGULAR],
    },
    data,
  ) as UserProfile;
};

export const givenUserProfileRequest = function (
  data?: Partial<UserProfileRequest>,
): UserProfileRequest {
  return Object.assign(
    {
      username: 'mock_user_123',
      email: 'mockuser123@mock.com',
      requestedPermission: Permission.REGULAR,
    },
    data,
  ) as UserProfileRequest;
};
