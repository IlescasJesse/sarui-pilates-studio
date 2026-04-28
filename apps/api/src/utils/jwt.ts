import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  id: string;
  role: string;
  email: string;
}

export interface DecodedToken extends JwtPayload, TokenPayload {}

export function signToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): DecodedToken {
  const decoded = jwt.verify(token, env.JWT_SECRET) as DecodedToken;
  return decoded;
}

export function signRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET + '_refresh', options);
}

export function verifyRefreshToken(token: string): DecodedToken {
  const decoded = jwt.verify(
    token,
    env.JWT_SECRET + '_refresh'
  ) as DecodedToken;
  return decoded;
}
