declare module 'i18next-fs-backend' {
  import { BackendModule } from 'i18next';

  interface I18nextFsBackendOptions {
    loadPath?: string;
    addPath?: string;
    jsonIndent?: number;
  }

  class I18nextFsBackend implements BackendModule {
    constructor(options?: I18nextFsBackendOptions);
    type: 'backend';
    init(services: any, backendOptions: I18nextFsBackendOptions, i18nextOptions: any): void;
    read(language: string, namespace: string, callback: (err: any, data: any) => void): void;
    create(languages: string[], namespace: string, key: string, fallbackValue: string): void;
  }

  export = I18nextFsBackend;
}