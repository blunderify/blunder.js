export interface ReporterOptions {
  projectId: number;
  projectKey: string;
  component: string;
  host: string;
  timeout: number;

  ignoreWindowError?: boolean;
}
