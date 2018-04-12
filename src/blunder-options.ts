import Processor from './processor/processor';
import Reporter from './reporter/reporter';
import { ReporterUserOptions } from './reporter/reporter-user-options.interface';

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
