import {AuthenticationComponent} from '@loopback/authentication';
import {JWTAuthenticationComponent} from '@loopback/authentication-jwt';
import {
  AuthorizationComponent,
  AuthorizationTags,
} from '@loopback/authorization';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import dotenv from 'dotenv';
import path from 'path';
import {BcryptjsAdapter, CryptoAdapterBindings} from './adapters';
import {AuthorizationProvider} from './providers';
import {MySequence} from './sequence';
import {TokenService, TokenServiceBindings} from './services';

dotenv.config();

export {ApplicationConfig};

export class UserMsApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({path: '/explorer'});
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    this.setupAdapters();
    this.setupAuth();
    this.setupTokenService();
  }

  private setupAdapters() {
    // Setup crypto adapters
    this.bind(CryptoAdapterBindings.BCRYPTJS).toInjectable(BcryptjsAdapter);
  }

  private setupAuth() {
    // Mount authentication system
    this.component(AuthenticationComponent);

    // Mount jwt component
    this.component(JWTAuthenticationComponent);

    // Mount Authorization Component
    this.component(AuthorizationComponent);
    this.bind('authorizationProviders.authorization-provider')
      .toProvider(AuthorizationProvider)
      .tag(AuthorizationTags.AUTHORIZER);
  }

  private setupTokenService() {
    // Bind the custom token service
    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(TokenService);

    // Bind variables for jwt access token
    this.bind(TokenServiceBindings.TOKEN_SERVICE_CONFIG).to({
      secret: process.env.USER_MS_ACCESS_TOKEN_SECRET ?? 'access_secret',
      regularTokenExpirationTime: +(
        process.env.USER_MS_ACCESS_TOKEN_EXPIRATION_TIME ?? 3600000
      ),
      emailVerificationTokenExpirationTime: +(
        process.env.USER_MS_VERIFY_EMAIL_TOKEN_EXPIRATION_TIME ?? 3600000
      ),
      passwordRecoveryTokenExpirationTime: +(
        process.env.USER_MS_UPDATE_PASSWORD_TOKEN_EXPIRATION_TIME ?? 3600000
      ),
    });
  }
}
