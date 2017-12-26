import { BlunderError } from '../blunder-error';

export type Callback = (name: string, err: BlunderError) => void;
export type Processor = (err: Error, cb: Callback) => void;
export default Processor;
