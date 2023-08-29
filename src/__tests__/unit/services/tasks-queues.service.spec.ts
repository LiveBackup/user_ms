import {expect} from '@loopback/testlab';
import sinon from 'sinon';
import {TasksQueuesService} from '../../../services';
import {givenServices} from '../../helpers/services.helpers';

describe('Unit testing - Tasks Queues Service', () => {
  let tasksQueuesService: TasksQueuesService;
  const sandbox = sinon.createSandbox();

  beforeEach(async () => {
    ({tasksQueuesService} = await givenServices());
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Email Verification Queue', () => {
    it('Enqueue the email verification job', async () => {
      const username = 'testuser123';
      const email = 'dummy@email.com';
      const token = 'dummy_token';
      const emailQueueSpy = sandbox.spy(
        tasksQueuesService.verificationEmailQueue,
        'add',
      );

      const emailEnqueued = await tasksQueuesService.enqueueVerificationEmail(
        username,
        email,
        token,
      );
      expect(emailEnqueued).to.be.True();
      expect(emailQueueSpy.calledOnce).to.be.True();
    });

    it('Fails to add a job into the email verification queue', async () => {
      const username = 'testuser123';
      const email = 'dummy@email.com';
      const token = 'dummy_token';
      const emailQueueStub = sandbox
        .stub(tasksQueuesService.verificationEmailQueue, 'add')
        .throws('Some error');

      const emailEnqueued = await tasksQueuesService.enqueueVerificationEmail(
        username,
        email,
        token,
      );
      expect(emailEnqueued).to.be.False();
      expect(emailQueueStub.calledOnce).to.be.True();
    });
  });

  describe('Recovery Password Queue', () => {
    it('Enqueue the Recevery password email job', async () => {
      const username = 'testuser123';
      const email = 'dummy@email.com';
      const token = 'dummy_token';
      const recoveryQueueSpy = sandbox.spy(
        tasksQueuesService.passwordRecovery,
        'add',
      );

      const recoveryEnqueued =
        await tasksQueuesService.enqueuePasswordRecoveryEmail(
          username,
          email,
          token,
        );
      expect(recoveryEnqueued).to.be.True();
      expect(recoveryQueueSpy.calledOnce).to.be.True();
    });

    it('Fails to enqueue the Recevery password email job', async () => {
      const username = 'testuser123';
      const email = 'dummy@email.com';
      const token = 'dummy_token';
      const recoveryQueueStub = sandbox
        .stub(tasksQueuesService.passwordRecovery, 'add')
        .throws('Some error');

      const recoveryEnqueued =
        await tasksQueuesService.enqueuePasswordRecoveryEmail(
          username,
          email,
          token,
        );
      expect(recoveryEnqueued).to.be.False();
      expect(recoveryQueueStub.calledOnce).to.be.True();
    });
  });
});
