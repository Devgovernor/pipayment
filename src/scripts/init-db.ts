import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { Role } from '../auth/enums/role.enum';
import { TemplateService } from '../notifications/services/template.service';
import { TemplateType } from '../notifications/entities/notification-template.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Create notification template first
    const templateService = app.get(TemplateService);
    await templateService.create({
      name: 'Account Creation',
      type: TemplateType.EMAIL,
      subject: 'Welcome to Pi Payment Gateway',
      content: 'Welcome {{name}}! Your account has been created successfully.',
      variables: {
        name: 'User name'
      }
    });

    // Create super admin user
    const authService = app.get(AuthService);
    await authService.createAdmin({
      email: 'admin@pipaymentgateway.com',
      password: 'Admin123!@#',
      role: Role.SUPER_ADMIN,
    });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await app.close();
  }
}

bootstrap();