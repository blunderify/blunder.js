import Promise from '../promise';
import Notice from '../notice';
import { ReporterOptions } from './reporter-options.interface';

export type Reporter = (notice: Notice, opts: ReporterOptions, promise: Promise) => void;
export default Reporter;

export function detectReporter(_opts): string {
    if (typeof fetch === 'function') {
        return 'fetch';
    }

    if (typeof XMLHttpRequest === 'function') {
        return 'xhr';
    }

    return 'node';
}

export let errors = {
    unauthorized: new Error('blunder: unauthorized: project id or key are wrong'),
    ipRateLimited: new Error('blunder: IP is rate limited'),
};
