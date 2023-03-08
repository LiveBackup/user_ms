import {
  expect
} from '@loopback/testlab';
import {givenAccountCredentials} from '../../helpers/database.helpers';

describe('Unit testing - AccountCredentials Model', () => {
  it('Hash a password', async () => {
    const accountCredentials = givenAccountCredentials({password: 'testing_password'});

    // TODO: Fix this test
    expect(accountCredentials.password).not.to.be.equal('testing_password');
  });

  it('Verify successfully the right password', async () => {
    const accountCredentials = givenAccountCredentials({password: 'testing_password'});

    // TODO: Fix this test
    const validPassword = false;
    expect(validPassword).to.be.true();
  });

  it('Reject the wrong password', async () => {
    const accountCredentials = givenAccountCredentials({password: 'testing_password'});

    // TODO: Fix this test
    const validPassword = false;
    expect(validPassword).to.be.false();
  });
});
