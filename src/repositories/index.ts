export * from './account-credentials.repository';
export * from './account.repository';
export * from './token.repository';

export class DatabaseError extends Error {
  length: number;
  name: string;
  severity: string;
  code: string;
  detail: string;
  schema: string;
  table: string;
  constraint: string;
  file: string;
  line: string;
  routine: string;
}
