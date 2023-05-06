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
    } else {
      const permissions = account.permissions as string[];
      if (metadata.deniedRoles?.some(dr => permissions.includes(dr))) {
        return AuthorizationDecision.DENY;
      } else if (!metadata.allowedRoles) {
        return AuthorizationDecision.ALLOW;
      } else if (metadata.allowedRoles.some(ar => permissions.includes(ar))) {
        return AuthorizationDecision.ALLOW;
      } else {
        return AuthorizationDecision.DENY;
      }
    }
  }
}
