import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
} from '@loopback/authorization';
import {InvocationContext} from '@loopback/core';
import {expect} from '@loopback/testlab';
import {ExtendedUserProfile, Permission} from '../../../models';
import {AuthorizationProvider} from '../../../providers';
import {givenExtendedUserProfile} from '../../helpers/models';

describe('Unit Testing - Authorization provider', () => {
  const authorizationProvider = new AuthorizationProvider();
  let authorizationContext: AuthorizationContext;
  let metadata: AuthorizationMetadata;
  let principal: ExtendedUserProfile;

  beforeEach(async () => {
    authorizationContext = {
      principals: [],
      roles: [],
      resource: '',
      scopes: [],
      invocationContext: undefined as unknown as InvocationContext,
    };
    metadata = {};
  });

  it('Deny user when no account is provided', async () => {
    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.DENY);
  });

  it('Allow user when no allowed or denied roles are provided', async () => {
    principal = givenExtendedUserProfile({permissions: [Permission.REGULAR]});
    authorizationContext.principals = [principal];

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.ALLOW);
  });

  it('Allow user when its role are included in allowed roles', async () => {
    principal = givenExtendedUserProfile({permissions: [Permission.REGULAR]});
    authorizationContext.principals = [principal];

    metadata = {
      allowedRoles: [Permission.REGULAR, Permission.VERIFY_EMAIL],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.ALLOW);
  });

  it('Allow user when its role are not included in denied roles', async () => {
    principal = givenExtendedUserProfile({
      permissions: [Permission.RECOVER_PASSWORD],
    });
    authorizationContext.principals = [principal];

    metadata = {
      deniedRoles: [Permission.REGULAR, Permission.VERIFY_EMAIL],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.ALLOW);
  });

  it('Deny user when its role are not included in allowed roles', async () => {
    principal = givenExtendedUserProfile({
      permissions: [Permission.RECOVER_PASSWORD],
    });
    authorizationContext.principals = [principal];

    metadata = {
      allowedRoles: [Permission.REGULAR, Permission.VERIFY_EMAIL],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.DENY);
  });

  it('Deny user when its role are included in denied roles', async () => {
    principal = givenExtendedUserProfile({permissions: [Permission.REGULAR]});
    authorizationContext.principals = [principal];

    metadata = {
      deniedRoles: [Permission.REGULAR, Permission.VERIFY_EMAIL],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.DENY);
  });

  it('Allow user when its role are included in allowed roles but not in denied roles', async () => {
    principal = givenExtendedUserProfile({permissions: [Permission.REGULAR]});
    authorizationContext.principals = [principal];

    metadata = {
      allowedRoles: [Permission.REGULAR, Permission.VERIFY_EMAIL],
      deniedRoles: [
        Permission.REQUEST_EMAIL_VERIFICATION,
        Permission.RECOVER_PASSWORD,
      ],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.ALLOW);
  });

  it('Deny user when its role are included in denied roles but not in allowed roles', async () => {
    principal = givenExtendedUserProfile({
      permissions: [Permission.RECOVER_PASSWORD],
    });
    authorizationContext.principals = [principal];

    metadata = {
      allowedRoles: [Permission.REGULAR, Permission.VERIFY_EMAIL],
      deniedRoles: [
        Permission.REQUEST_EMAIL_VERIFICATION,
        Permission.RECOVER_PASSWORD,
      ],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.DENY);
  });

  it('Deny user when its role is not included in neither allowed nor denied roles', async () => {
    principal = givenExtendedUserProfile({
      permissions: [Permission.RECOVER_PASSWORD],
    });
    authorizationContext.principals = [principal];

    metadata = {
      allowedRoles: [Permission.REGULAR, Permission.VERIFY_EMAIL],
      deniedRoles: [Permission.REQUEST_EMAIL_VERIFICATION],
    };

    const authorizationDecision = await authorizationProvider.authorize(
      authorizationContext,
      metadata,
    );
    expect(authorizationDecision).to.be.equal(AuthorizationDecision.DENY);
  });
});
