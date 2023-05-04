import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  Authorizer,
} from '@loopback/authorization';
import {Provider} from '@loopback/core';

// Class level authorizer
export class AuthorizationProvider implements Provider<Authorizer> {
  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    authorizationCtx: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ): Promise<AuthorizationDecision> {
    const account = authorizationCtx.principals[0];
    if (!account) {
      return AuthorizationDecision.DENY;
    }

    return metadata.allowedRoles?.includes(account.permission)
      ? AuthorizationDecision.ALLOW
      : AuthorizationDecision.DENY;
  }
}
