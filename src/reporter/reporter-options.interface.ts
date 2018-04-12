import { ReporterUserOptions } from './reporter-user-options.interface';

export interface ReporterOptions {
  projectId: string;
  projectKey: string;
  component: string;
  environment: string;
  host: string;
  timeout: number;
  user?: ReporterUserOptions;

  ignoreWindowError?: boolean;
}
