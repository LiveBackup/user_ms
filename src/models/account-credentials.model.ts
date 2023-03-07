import {belongsTo, Entity, model, property} from '@loopback/repository';
import {compare, genSalt, hash} from 'bcryptjs';
import {Account} from './account.model';

/* eslint-disable @typescript-eslint/naming-convention */
@model()
export class AccountCredentials extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuidv4',
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @belongsTo(() => Account, {name: 'account_credentials'})
  account_id: string;

  constructor(data?: Partial<AccountCredentials>) {
    super(data);
  }

  // Hash the password stored in the model object
  public async hashPassword() {
    this.password = await hash(this.password, await genSalt());
  }

  // Compares a given password against the password stored in the object
  public async verifyPassword(password: string): Promise<boolean> {
    return compare(password, this.password);
  }
}

export interface AccountCredentialsRelations {
  // describe navigational properties here
}

export type AccountCredentialsWithRelations = AccountCredentials & AccountCredentialsRelations;
