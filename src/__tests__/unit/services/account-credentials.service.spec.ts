import {expect, sinon} from '@loopback/testlab';
import {ICryptoAdapter} from '../../../adapters';
import {IAccountCredentialsRepository} from '../../../repositories';
import {AccountCredentialsService} from '../../../services';
import {
  givenAccountCredentials,
  givenUserProfile,
} from '../../helpers/models';

describe('Unit testing - Token service', () => {
  // Sandbox
  const sandbox = sinon.createSandbox();
  // Adapters
  let cryptoAdapter: ICryptoAdapter;
  // Services
  let accountCredentialsService: AccountCredentialsService;
  // Repositories
  let accountCredentialsRepository: IAccountCredentialsRepository;

  beforeEach(() => {
    cryptoAdapter = <ICryptoAdapter>{};
    accountCredentialsRepository = <IAccountCredentialsRepository>{};

    accountCredentialsService = new AccountCredentialsService(
      accountCredentialsRepository,
      cryptoAdapter,
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Update password', () => {
    it('Updates a password', async () => {
      // Stubs setup
      const findCredentialsStub = sinon
        .stub()
        .returns(Promise.resolve(givenAccountCredentials()));
      accountCredentialsRepository.findOneByAccountId = findCredentialsStub;

      const comparesPasswordStub = sinon.stub().returns(Promise.resolve(false));
      cryptoAdapter.comparePassword = comparesPasswordStub;

      const hashPasswordStub = sinon.stub().returns(Promise.resolve(''));
      cryptoAdapter.hashPassword = hashPasswordStub;

      const updateCredentialsByIdStub = sinon.stub().resolves();
      accountCredentialsRepository.updateCredentialsById =
        updateCredentialsByIdStub;

      // Method execution
      const profile = givenUserProfile();
      await accountCredentialsService.updatePassword(profile, {
        password: 'pwd',
      });

      // Validate the stubs
      expect(findCredentialsStub.calledOnce).to.be.True();
      expect(comparesPasswordStub.calledOnce).to.be.True();
      expect(hashPasswordStub.calledOnce).to.be.True();
      expect(updateCredentialsByIdStub.calledOnce).to.be.True();
    });

    it('Fails when old and new password matched', async () => {
      // Stubs setup
      const findCredentialsStub = sinon
        .stub()
        .returns(Promise.resolve(givenAccountCredentials()));
      accountCredentialsRepository.findOneByAccountId = findCredentialsStub;

      const comparesPasswordStub = sinon.stub().returns(Promise.resolve(true));
      cryptoAdapter.comparePassword = comparesPasswordStub;

      // Method execution
      let error: Error | undefined = undefined;
      try {
        const profile = givenUserProfile();
        await accountCredentialsService.updatePassword(profile, {
          password: 'pwd',
        });
      } catch (e) {
        error = e;
      }

      expect(error).not.to.be.undefined();
      expect(error?.message).to.be.equal(
        'The new password can not be equal to old password',
      );
    });

    it('Does not find the account credentials', async () => {
      // Stubs setup
      const findCredentialsStub = sinon
        .stub()
        .returns(Promise.resolve(undefined));
      accountCredentialsRepository.findOneByAccountId = findCredentialsStub;

      // Method execution
      let error: Error | undefined = undefined;
      try {
        const profile = givenUserProfile();
        await accountCredentialsService.updatePassword(profile, {
          password: 'pwd',
        });
      } catch (e) {
        error = e;
      }

      expect(error).not.to.be.undefined();
      expect(error?.message).to.be.equal(
        'The account credentials were not found',
      );
    });
  });
});
