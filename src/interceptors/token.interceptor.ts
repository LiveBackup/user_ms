import {TokenServiceBindings} from '@loopback/authentication-jwt';
import {
  BindingScope,
  inject,
  injectable,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {SecurityBindings} from '@loopback/security';
import {ExtendedUserProfile, TokenService} from '../services';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@injectable({
  tags: {key: TokenInterceptor.BINDING_KEY},
  scope: BindingScope.TRANSIENT,
})
export class TokenInterceptor implements Provider<Interceptor> {
  // static readonly name = 'token';
  static readonly BINDING_KEY = `interceptors.${TokenInterceptor.name}`;

  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    protected tokenService: TokenService,
    @inject(SecurityBindings.USER)
    protected requester: ExtendedUserProfile,
  ) {}

  /**
   * This method is used by LoopBack context to produce an interceptor function
   * for the binding.
   *
   * @returns An interceptor function
   */
  value() {
    return this.intercept.bind(this);
  }

  /**
   * The logic to intercept an invocation
   * @param invocationCtx - Invocation context
   * @param next - A function to invoke next interceptor or the target method
   */
  async intercept(
    _: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    // Method invocation
    const result = await next();

    // Post-invocation logic
    if (this.requester.isOneUsageProfile)
      await this.tokenService.revokeToken(this.requester.token);

    return result;
  }
}
