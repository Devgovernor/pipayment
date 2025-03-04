import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from './template.service';
import { MonitoringService } from '../../monitoring/monitoring.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
    private readonly monitoringService: MonitoringService,
  ) {}

  async sendTemplatedEmail(
    to: string,
    templateId: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      const template = await this.templateService.findOne(templateId);
      const content = await this.templateService.renderTemplate(templateId, data);

      await this.mailerService.sendMail({
        to,
        subject: template.subject,
        html: content,
      });

      this.logger.debug(`Email sent successfully to ${to}`);
      
      // Record metric
      this.monitoringService.recordMetric('email.sent', 1, {
        template: templateId,
        success: true,
      });
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      
      // Record error metric
      this.monitoringService.recordMetric('email.error', 1, {
        template: templateId,
        error: error.message,
      });
      
      throw error;
    }
  }

  async sendRawEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });

      this.logger.debug(`Raw email sent successfully to ${to}`);
      
      // Record metric
      this.monitoringService.recordMetric('email.sent', 1, {
        type: 'raw',
        success: true,
      });
    } catch (error) {
      this.logger.error(`Failed to send raw email: ${error.message}`, error.stack);
      
      // Record error metric
      this.monitoringService.recordMetric('email.error', 1, {
        type: 'raw',
        error: error.message,
      });
      
      throw error;
    }
  }
}