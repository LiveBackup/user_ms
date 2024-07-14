import {BindingKey} from '@loopback/core';
import {BcryptjsAdapter} from './bcryptjs';

export namespace CryptoAdapterBindings {
  export const BCRYPTJS = BindingKey.create<BcryptjsAdapter>(
    'adapters.crypto-adapter.bcryptjs',
  );
}

export * from './bcryptjs';
export * from './icrypto-adapter';
