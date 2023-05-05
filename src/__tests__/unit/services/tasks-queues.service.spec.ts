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

  it('Add a job to email verification queue', async () => {
    const username = 'testuser123';
    const email = 'dummy@email.com';
    const token = 'dummy_token';
    const emailQueueSpy = sandbox.spy(
      TasksQueuesService.verificationEmailQueue,
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
      .stub(TasksQueuesService.verificationEmailQueue, 'add')
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
