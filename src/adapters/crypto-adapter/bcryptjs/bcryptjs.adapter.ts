import {BindingScope, injectable} from '@loopback/core';
import * as bcrypt from 'bcryptjs';
import {ICryptoAdapter} from '../icrypto-adapter';

@injectable({scope: BindingScope.SINGLETON})
export class BcryptjsAdapter implements ICryptoAdapter {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
