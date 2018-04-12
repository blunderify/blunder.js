import Promise from './promise';
import Notice from './notice';
import { BlunderOptions } from './blunder-options';
import { BlunderError } from './blunder-error';
import FuncWrapper from './func-wrapper';

import Processor from './processor/processor';
import stacktracejsProcessor from './processor/stacktracejs';

import Filter from './filter/filter';
import ignoreFilter from './filter/ignore';
import makeDebounceFilter from './filter/debounce';
import uncaughtMessageFilter from './filter/uncaught-message';
import angularMessageFilter from './filter/angular-message';
import windowFilter from './filter/window';
import nodeFilter from './filter/node';

import { Reporter, detectReporter } from './reporter/reporter';
import { ReporterOptions } from './reporter/reporter-options.interface';
import { ReporterUserOptions } from './reporter/reporter-user-options.interface';
import fetchReporter from './reporter/fetch';
import nodeReporter from './reporter/node';
import xhrReporter from './reporter/xhr';

import { historian, getHistory } from './instrumentation/historian';

declare const VERSION: string;

class Client {
  private opts: ReporterOptions = {} as ReporterOptions;

  private processor: Processor;
  private reporters: Reporter[] = [];
  private filters: Filter[] = [];

  private offline = false;
  private errors: any[] = [];

  constructor(opts: BlunderOptions = {}) {
    if (opts.projectId) this.opts.projectId = opts.projectId;
    if (opts.projectKey) this.opts.projectKey = opts.projectKey;
    if (opts.user) this.opts.user = opts.user;

    this.opts.host = this.opts.host || 'https://collector.blunderify.se';
    this.opts.timeout = this.opts.timeout || 10000;
    this.opts.component = this.opts.component || '';
    this.opts.environment = this.opts.environment || 'production';
    this.opts.ignoreWindowError = opts.ignoreWindowError;

    this.processor = opts.processor || stacktracejsProcessor;
    this.addReporter(opts.reporter || detectReporter(opts));

    this.addFilter(ignoreFilter);
    this.addFilter(makeDebounceFilter());
    this.addFilter(uncaughtMessageFilter);
    this.addFilter(angularMessageFilter);

    if (typeof window === 'object') {
      this.addFilter(windowFilter);

      if (typeof window.addEventListener === 'function') {
        window.addEventListener('online', this.onOnline.bind(this));
        window.addEventListener('offline', () => this.offline = true);
      }
    } else {
      this.addFilter(nodeFilter);
    }

    historian.registerNotifier(this);
  }

  setProject(id: string, key: string): void {
    this.opts.projectId = id;
    this.opts.projectKey = key;
  }

  setHost(host: string) {
    this.opts.host = host;
  }

  setComponent(component: string) {
    this.opts.component = component;
  }

  setEnvironment(env: string) {
    this.opts.environment = env;
  }

  getUser(): ReporterUserOptions | undefined {
    return this.opts.user;
  }

  setUser(userId: string, userEmail: string, userName: string): void {
    this.opts.user = this.opts.user || {};
    this.opts.user.id = userId;
    this.opts.user.email = userEmail;
    this.opts.user.name = userName;
  }

  setUserId(userId: string): void {
    this.opts.user = this.opts.user || {};
    this.opts.user.id = userId;
  }

  setUserName(userName: string): void {
    this.opts.user = this.opts.user || {};
    this.opts.user.name = userName;
  }

  setUserEmail(userEmail: string): void {
    this.opts.user = this.opts.user || {};
    this.opts.user.email = userEmail;
  }

  addReporter(name: string | Reporter): void {
    let reporter: Reporter;
    switch (name) {
      case 'fetch':
        reporter = fetchReporter;
        break;
      case 'node':
        reporter = nodeReporter;
        break;
      case 'xhr':
        reporter = xhrReporter;
        break;
      default:
        reporter = name as Reporter;
    }
    this.reporters.push(reporter);
  }

  addFilter(filter: Filter): void {
    this.filters.push(filter);
  }

  notify(err: any): Promise {
    if (typeof err !== 'object' || err.error === undefined) {
      err = { error: err };
    }
    let promise = err.promise || new Promise();

    if (!err.error) {
      let reason = new Error(
        `blunder-js: got err=${JSON.stringify(err.error)}, wanted an Error`);
      promise.reject(reason);
      return promise;
    }

    if (this.opts.ignoreWindowError && err.context && err.context.windowError) {
      let reason = new Error('blunder-js: window error is ignored');
      promise.reject(reason);
      return promise;
    }

    if (this.offline) {
      err.promise = promise;
      this.errors.push(err);
      if (this.errors.length > 100) {
        this.errors.slice(-100);
      }
      return promise;
    }

    let notice: Notice = {
      id: '',
      errors: [],
      context: Object.assign({
        language: 'JavaScript',
        severity: 'error',
        component: this.opts.component,
        environment: this.opts.environment,
        notifier: {
          name: 'blunder-js',
          version: VERSION,
          url: 'https://github.com/blunderify/blunder.js',
        },
      }, err.context),
      params: err.params || {},
      environment: err.environment || {},
      session: err.session || {},
    };

    let user = this.getUser();
    if (user != null) {
      notice.context.user = user;
    }

    let history = getHistory();
    if (history.length > 0) {
      notice.context.history = history;
    }

    this.processor(err.error, (_: string, error: BlunderError): void => {
      notice.errors.push(error);

      for (let filter of this.filters) {
        let r = filter(notice);
        if (r === null) {
          promise.reject(new Error('blunder-js: error is filtered'));
          return;
        }
        notice = r;
      }

      for (let reporter of this.reporters) {
        reporter(notice, this.opts, promise);
      }
    });

    return promise;
  }

  wrap(fn): FuncWrapper {
    if (fn._blunder) {
      return fn;
    }

    let client = this;
    let blunderWrapper = function () {
      let fnArgs = Array.prototype.slice.call(arguments);
      let wrappedArgs = client.wrapArguments(fnArgs);
      try {
        return fn.apply(this, wrappedArgs);
      } catch (err) {
        client.notify({ error: err, params: { arguments: fnArgs } });
        historian.ignoreNextWindowError();
        throw err;
      }
    } as FuncWrapper;

    for (let prop in fn) {
      if (fn.hasOwnProperty(prop)) {
        blunderWrapper[prop] = fn[prop];
      }
    }

    blunderWrapper._blunder = true;
    blunderWrapper.inner = fn;

    return blunderWrapper;
  }

  private wrapArguments(args: any[]): any[] {
    for (let i in args) {
      let arg = args[i];
      if (typeof arg === 'function') {
        args[i] = this.wrap(arg);
      }
    }
    return args;
  }

  call(fn, ..._args: any[]): any {
    let wrapper = this.wrap(fn);
    return wrapper.apply(this, Array.prototype.slice.call(arguments, 1));
  }

  onerror(): void {
    historian.onerror.apply(historian, arguments);
  }

  private onOnline(): void {
    this.offline = false;

    for (let err of this.errors) {
      this.notify(err);
    }
    this.errors = [];
  }
}

export = Client;
