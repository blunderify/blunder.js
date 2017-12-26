import { BlunderError } from './blunder-error';

export interface Notice {
  id: string;
  errors: BlunderError[];
  context: any;
  params: any;
  session: any;
  environment: any;

  _json?: string;
}

export default Notice;
