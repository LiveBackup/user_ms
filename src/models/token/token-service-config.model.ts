export interface TokenServiceConfig {
  secret: string;
  regularTokenExpirationTime: number;
  emailVerificationTokenExpirationTime: number;
  passwordRecoveryTokenExpirationTime: number;
}
