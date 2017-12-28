export interface ReporterOptions {
  projectId: number;
  projectKey: string;
  component: string;
  environment: string;
  host: string;
  timeout: number;

  ignoreWindowError?: boolean;
}
