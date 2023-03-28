import {
  expect
} from '@loopback/testlab';
import {AccountCredentialsService} from '../../../services';
import {givenAccountCredentials} from '../../helpers/database.helpers';
import {givenServices} from '../../helpers/services.helpers';

describe('Unit testing - AccountCredentials service', () => {

  let accountCredentialsService: AccountCredentialsService;

  before(async () => {
    ({accountCredentialsService} = givenServices());
  });

  describe('Passwords hashing and verification', () => {
    it('Hash a password', async () => {
      const accountCredentials = givenAccountCredentials({password: 'testing_password'});
      accountCredentials.password = await accountCredentialsService
        .hashPassword(accountCredentials.password);

      expect(accountCredentials.password).not.to.be.equal('testing_password');
    });

    it('Verify successfully the right password', async () => {
      const password = 'testing_password'
      const accountCredentials = givenAccountCredentials({password});
      accountCredentials.password = await accountCredentialsService
        .hashPassword(password);

      const validPassword = await accountCredentialsService
        .verifyPassword(password, accountCredentials.password);
      expect(validPassword).to.be.true();
    });

    it('Reject the wrong password', async () => {
      const accountCredentials = givenAccountCredentials({password: 'testing_password'});
      accountCredentials.password = await accountCredentialsService
        .hashPassword(accountCredentials.password);

      const validPassword = await accountCredentialsService
        .verifyPassword('Another password', accountCredentials.password);
      expect(validPassword).to.be.false();
    });

    it.skip('Creates the Account Credentials', async () => {
      // TODO: Implement this test
    });
  });
});
