import Promise from '../promise';
import Notice from '../notice';

export interface ReporterOptions {
    projectId: number;
    projectKey: string;
    host: string;
    timeout: number;

    ignoreWindowError?: boolean;
}

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
