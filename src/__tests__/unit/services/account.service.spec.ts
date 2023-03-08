import {
  expect
} from '@loopback/testlab';
import {AccountRepository} from '../../../repositories';
import {AccountService} from '../../../services';
import {givenAccount, givenAccountCredentials, givenRepositories} from '../../helpers/database.helpers';
import {givenServices} from '../../helpers/services.helpers';

describe('Unit testing - AccountCredentials Model', () => {

  let accountRepository: AccountRepository;
  let accountService: AccountService;

  before(async () => {
    ({accountRepository} = await givenRepositories());
    ({accountService} = await givenServices());
  });

  describe('Passwords hashing and verification', () => {
    it('Hash a password', async () => {
      const accountCredentials = givenAccountCredentials({password: 'testing_password'});
      accountCredentials.password = await accountService
        .hashPassword(accountCredentials.password);

      expect(accountCredentials.password).not.to.be.equal('testing_password');
    });

    it('Verify successfully the right password', async () => {
      const password = 'testing_password'
      const accountCredentials = givenAccountCredentials({password});
      accountCredentials.password = await accountService.hashPassword(password);

      const validPassword = await accountService
        .verifyPassword(password, accountCredentials.password);
      expect(validPassword).to.be.true();
    });

    it('Reject the wrong password', async () => {
      const accountCredentials = givenAccountCredentials({password: 'testing_password'});
      accountCredentials.password = await accountService
        .hashPassword(accountCredentials.password);

      const validPassword = await accountService
        .verifyPassword('Another password', accountCredentials.password);
      expect(validPassword).to.be.false();
    });
  });

  describe('Database methods', () => {
    it('Creates a new Account', async () => {
      const account = givenAccount();
      await accountService.create(account);

      const savedAccount = await accountRepository.findOne({where: {email: account.email}});
      expect(savedAccount).not.to.be.null();
      expect(savedAccount?.email).to.be.equal(account.email);
      expect(savedAccount?.username).to.be.equal(account.username);
    });

    it('Finds an account by its email', async () => {
      const account = givenAccount();
      await accountService.create(account);

      const savedAccount = await accountService.findByEmail(account.email);
      expect(savedAccount).not.to.be.null();
      expect(savedAccount?.email).to.be.equal(account.email);
      expect(savedAccount?.username).to.be.equal(account.username);
    });

    it('Finds an account by its username', async () => {
      const account = givenAccount();
      await accountService.create(account);

      const savedAccount = await accountService.findByUsername(account.email);
      expect(savedAccount).not.to.be.null();
      expect(savedAccount?.email).to.be.equal(account.email);
      expect(savedAccount?.username).to.be.equal(account.username);
    });

    it('Creates the Account Credentials', async () => {
    });
  });
});
