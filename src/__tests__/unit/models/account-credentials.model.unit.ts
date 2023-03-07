import {
  expect
} from '@loopback/testlab';
import {AccountCredentials} from '../../../models';
import {givenAccountCredentials} from '../../helpers/database.helpers';

describe('Unit testing - AccountCredentials Model', () => {
  it('Should Hash a password', async () => {
    const accountCredentials = new AccountCredentials(
      givenAccountCredentials({password: 'testing_password'}),
    );
    await accountCredentials.hashPassword();

    expect(accountCredentials.password).not.to.be.equal('testing_password');
  });

  it('Should successfully verify the right password', async () => {
    const accountCredentials = new AccountCredentials(
      givenAccountCredentials({password: 'testing_password'}),
    );
    await accountCredentials.hashPassword();

    const validPassword = await accountCredentials
      .verifyPassword('testing_password');
    expect(validPassword).to.be.true();
  });

  it('Should reject the wrong password', async () => {
    const accountCredentials = new AccountCredentials(
      givenAccountCredentials({password: 'testing_password'}),
    );
    await accountCredentials.hashPassword();

    const validPassword = await accountCredentials
      .verifyPassword('Is not the password');
    expect(validPassword).to.be.false();
  });
});
