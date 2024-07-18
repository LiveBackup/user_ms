export enum Permission {
  REGULAR = 'REGULAR',
  RECOVER_PASSWORD = 'RECOVER_PASSWORD',
  REQUEST_EMAIL_VERIFICATION = 'REQUEST_EMAIL_VERIFICATION',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
}

export interface Token {
  id: string;
  tokenSecret: string;
  isOneUsageToken: boolean;
  accountId: string;
  allowedActions: Permission[];
  expirationDate: Date;
}
