import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
} from '@loopback/authorization';
import {InvocationContext} from '@loopback/core';
import {expect} from '@loopback/testlab';
import {Permissions} from '../../../models';
import {AuthorizationProvider} from '../../../providers';
import {RequestUserProfile} from '../../../services';
import {givenRequestUserProfile} from '../../helpers/services.helpers';

describe('Unit Testing - Authorization provider', () => {
  const authorizationProvider = new AuthorizationProvider();
  let authorizationContext: AuthorizationContext;
  let metadata: AuthorizationMetadata;
  let principal: RequestUserProfile;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  beforeEach(() => {
    authorizationContext = {
      principals: [],
      roles: [],
      resource: '',
      scopes: [],
      invocationContext: undefined as any as InvocationContext,
    };
    metadata = {};
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  it('Deny user when no account is provided', async () => {
    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.DENY);
  });

  it('Allow user when no allowed or denied roles are provided', async () => {
    principal = givenRequestUserProfile();
    authorizationContext.principals = [principal];

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.ALLOW);
  });

  it('Allow user when its role are included in allowed roles', async () => {
    principal = givenRequestUserProfile({permissions: [Permissions.REGULAR]});
    authorizationContext.principals = [principal];
    metadata = {
      allowedRoles: [Permissions.REGULAR, Permissions.VERIFY_EMAIL],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.ALLOW);
  });

  it('Allow user when its role are not included in denied roles', async () => {
    principal = givenRequestUserProfile({
      permissions: [Permissions.RECOVER_PASSWORD],
    });
    authorizationContext.principals = [principal];
    metadata = {
      deniedRoles: [Permissions.REGULAR, Permissions.VERIFY_EMAIL],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.ALLOW);
  });

  it('Deny user when its role are not included in allowed roles', async () => {
    principal = givenRequestUserProfile({
      permissions: [Permissions.RECOVER_PASSWORD],
    });
    authorizationContext.principals = [principal];
    metadata = {
      allowedRoles: [Permissions.REGULAR, Permissions.VERIFY_EMAIL],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.DENY);
  });

  it('Deny user when its role are included in denied roles', async () => {
    principal = givenRequestUserProfile({permissions: [Permissions.REGULAR]});
    authorizationContext.principals = [principal];
    metadata = {
      deniedRoles: [Permissions.REGULAR, Permissions.VERIFY_EMAIL],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.DENY);
  });

  it('Allow user when its role are included in allowed roles but not in denied roles', async () => {
    principal = givenRequestUserProfile({permissions: [Permissions.REGULAR]});
    authorizationContext.principals = [principal];
    metadata = {
      allowedRoles: [Permissions.REGULAR, Permissions.VERIFY_EMAIL],
      deniedRoles: [
        Permissions.REQUEST_EMAIL_VERIFICATION,
        Permissions.RECOVER_PASSWORD,
      ],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.ALLOW);
  });

  it('Deny user when its role are included in denied roles but not in allowed roles', async () => {
    principal = givenRequestUserProfile({
      permissions: [Permissions.RECOVER_PASSWORD],
    });
    authorizationContext.principals = [principal];
    metadata = {
      allowedRoles: [Permissions.REGULAR, Permissions.VERIFY_EMAIL],
      deniedRoles: [
        Permissions.REQUEST_EMAIL_VERIFICATION,
        Permissions.RECOVER_PASSWORD,
      ],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.DENY);
  });

  it('Deny user when its role is not included in neither allowed nor denied roles', async () => {
    principal = givenRequestUserProfile({
      permissions: [Permissions.RECOVER_PASSWORD],
    });
    authorizationContext.principals = [principal];
    metadata = {
      allowedRoles: [Permissions.REGULAR, Permissions.VERIFY_EMAIL],
      deniedRoles: [Permissions.REQUEST_EMAIL_VERIFICATION],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.DENY);
  });
});
