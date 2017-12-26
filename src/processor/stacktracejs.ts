import ErrorStackParser = require('error-stack-parser');

import { BlunderFrame } from '../blunder-frame';
import { Callback } from './processor';

const hasConsole = typeof console === 'object' && console.warn;

export interface StackFrame {
  functionName?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export interface BlunderError extends Error, StackFrame {
  noStack?: boolean;
}

function parse(err: BlunderError): StackFrame[] {
  try {
    return ErrorStackParser.parse(err);
  } catch (parseErr) {
    if (hasConsole && err.stack) {
      console.warn('ErrorStackParser:', parseErr.toString(), err.stack);
    }
  }

  if (err.fileName) {
    return [err];
  }

  return [];
}

export default function processor(err: BlunderError, cb: Callback): void {
  let backtrace: BlunderFrame[] = [];

  if (!err.noStack) {
    let frames = parse(err);
    if (frames.length === 0) {
      try {
        throw new Error('fake');
      } catch (fakeErr) {
        frames = parse(fakeErr);
        frames.shift();
        frames.shift();
      }
    }

    for (let frame of frames) {
      backtrace.push({
        function: frame.functionName || '',
        file: frame.fileName || '',
        line: frame.lineNumber || 0,
        column: frame.columnNumber || 0,
      });
    }
  }

  let type: string;
  if (err.name) {
    type = err.name;
  } else {
    type = '';
  }

  let msg: string;
  if (err.message) {
    msg = String(err.message);
  } else {
    msg = String(err);
  }

  cb('stacktracejs', {
    type: type,
    message: msg,
    backtrace: backtrace,
  });
}
