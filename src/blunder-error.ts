import { BlunderFrame } from './blunder-frame';

export interface BlunderError {
  type: string;
  message: string;
  backtrace: BlunderFrame[];
}
