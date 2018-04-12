// Type definitions for blunder-js 0.2.0
// Project: Blunder
// Definitions by: Per Christian B. Viken <https://eastblue.org/~perchr/>

/*~ Note that ES6 modules cannot directly export class objects.
 *~ This file should be imported using the CommonJS-style:
 *~   import x = require('someLibrary');
 *~
 *~ Refer to the documentation to understand common
 *~ workarounds for this limitation of ES6 modules.
 */

export as namespace blunder;
export = blunder.Client;

declare namespace blunder {
  export type Callback = (name: string, err: BlunderError) => void;
  export type Filter = (notice: Notice) => Notice | null;
  export type Processor = (err: Error, cb: Callback) => void;
  export type Rejector = (reason: Error) => void;
  export type Reporter = (notice: Notice, opts: ReporterOptions, promise: Promise) => void;
  export type Resolver = (value: any) => void;

  export class Client {
    constructor(opts?: any);

    setProject(id: string, key: string): void;
    setHost(host: string): void;
    setComponent(component: string): void;
    setEnvironment(env: string): void;
    getUser(): blunder.ReporterUserOptions | undefined;
    setUser(userId: string, userEmail: string, userName: string): void;
    setUserId(userId: string): void;
    setUserEmail(userEmail: string): void;
    setUserName(userName: string): void;
    addReporter(name: string | blunder.Reporter): void;
    addFilter(filter: blunder.Filter): void;
    notify(err: any): blunder.Promise;
    wrap(fn): blunder.FuncWrapper;
    call(fn, ..._args: any[]): any;
    onerror(): void;
  }

  export interface BlunderError {
    type: string;
    message: string;
    backtrace: BlunderFrame[];
  }

  export interface BlunderFrame {
    function: string;
    file: string;
    line: number;
    column: number;
  }

  export interface BlunderOptions {
    component?: string;
    environment?: string;
    host?: string;
    timeout?: number;
    processor?: Processor;
    projectId?: string;
    projectKey?: string;
    reporter?: Reporter;
    user?: ReporterUserOptions;
    ignoreWindowError?: boolean;
  }

  export interface FuncWrapper {
    (): any;
    inner: () => any;
    _blunder?: boolean;
  }

  export interface Notice {
    id: string;
    errors: BlunderError[];
    context: any;
    params: any;
    session: any;
    environment: any;

    _json?: string;
  }

  export interface Promise {
    constructor(executor?);

    then(onResolved: Resolver, onRejected?: Rejector): Promise;
    catch(onRejected: Rejector): Promise;
    resolve(value: any): Promise;
    reject(reason: Error): Promise;
  }

  export interface ReporterOptions {
    projectId: number;
    projectKey: string;
    component: string;
    environment: string;
    host: string;
    timeout: number;
    user?: ReporterUserOptions;

    ignoreWindowError?: boolean;
  }

  export interface ReporterUserOptions {
    id?: string;
    email?: string;
    name?: string;
  }
}
