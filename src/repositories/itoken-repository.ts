import {NewToken, Token} from '../models';

export interface ITokenRepository {
  createToken(token: NewToken): Promise<Token>;
  findTokenById(id: string): Promise<Token | null>;
  deleteTokenById(id: string): Promise<Token | null>;
}
