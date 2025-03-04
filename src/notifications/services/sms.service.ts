import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { TemplateService } from './template.service';

@Injectable()
export class SmsService {
  private client: twilio.Twilio | null = null;
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    if (this.configService.get('app.twilio.enabled')) {
      const accountSid = this.configService.get('app.twilio.accountSid');
      const authToken = this.configService.get('app.twilio.authToken');
      
      if (accountSid && authToken) {
        try {
          this.client = twilio(accountSid, authToken);
          this.logger.log('Twilio client initialized successfully');
        } catch (error) {
          this.logger.error('Failed to initialize Twilio client:', error.message);
          this.client = null;
        }
      } else {
        this.logger.warn('Twilio credentials not provided. SMS functionality will be disabled.');
      }
    } else {
      this.logger.log('SMS functionality is disabled via configuration.');
    }
  }

  async sendTemplatedSms(
    to: string,
    templateId: string,
    data: Record<string, any>,
  ): Promise<void> {
    if (!this.client) {
      this.logger.warn('SMS sending skipped - service is disabled or not configured');
      return;
    }

    try {
      const content = await this.templateService.renderTemplate(templateId, data);
      const phoneNumber = this.configService.get<string>('app.twilio.phoneNumber');

      if (!phoneNumber) {
        throw new Error('Twilio phone number not configured');
      }

      await this.client.messages.create({
        body: content,
        to,
        from: phoneNumber,
      });

      this.logger.debug(`SMS sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      // Don't throw the error - fail gracefully
      // This prevents SMS failures from breaking the application flow
    }
  }
}