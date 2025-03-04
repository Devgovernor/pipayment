import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import * as path from 'path';

@Injectable()
export class I18nService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      await i18next
        .use(Backend)
        .init({
          backend: {
            loadPath: path.join(process.cwd(), 'src/config/i18n/{{lng}}/{{ns}}.json'),
          },
          fallbackLng: 'en',
          preload: ['en', 'es'],
          ns: ['common'],
          defaultNS: 'common',
        });
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
    }
  }

  translate(key: string, options?: any): string {
    try {
      const translation = i18next.t(key, options);
      return typeof translation === 'string' ? translation : key;
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  }

  changeLanguage(lang: string): void {
    try {
      i18next.changeLanguage(lang);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }
}