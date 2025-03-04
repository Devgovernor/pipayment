import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckoutTemplate } from '../entities/checkout-template.entity';
import { CreateCheckoutTemplateDto } from '../dto/create-checkout-template.dto';
import { Merchant } from '../../database/entities/merchant.entity';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(CheckoutTemplate)
    private readonly checkoutTemplateRepository: Repository<CheckoutTemplate>,
  ) {}

  async createTemplate(
    merchant: Merchant,
    createTemplateDto: CreateCheckoutTemplateDto,
  ): Promise<CheckoutTemplate> {
    const existingTemplate = await this.checkoutTemplateRepository.findOne({
      where: {
        merchant: { id: merchant.id },
        name: createTemplateDto.name,
      },
    });

    if (existingTemplate) {
      throw new ConflictException('Template with this name already exists');
    }

    const template = this.checkoutTemplateRepository.create({
      ...createTemplateDto,
      merchant,
    });

    return this.checkoutTemplateRepository.save(template);
  }

  async findOne(id: string): Promise<CheckoutTemplate> {
    const template = await this.checkoutTemplateRepository.findOne({
      where: { id },
      relations: ['merchant'],
    });

    if (!template) {
      throw new NotFoundException(`Checkout template with ID "${id}" not found`);
    }

    return template;
  }

  async findByMerchant(merchantId: string): Promise<CheckoutTemplate[]> {
    return this.checkoutTemplateRepository.find({
      where: { merchant: { id: merchantId } },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateTemplateDto: Partial<CreateCheckoutTemplateDto>,
  ): Promise<CheckoutTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, updateTemplateDto);
    return this.checkoutTemplateRepository.save(template);
  }

  async deactivate(id: string): Promise<void> {
    const template = await this.findOne(id);
    template.isActive = false;
    await this.checkoutTemplateRepository.save(template);
  }

  async renderCheckout(templateId: string, paymentData: any): Promise<string> {
    const template = await this.findOne(templateId);
    
    // Generate dynamic checkout HTML based on template and payment data
    const html = this.generateCheckoutHtml(template, paymentData);
    
    return html;
  }

  private generateCheckoutHtml(template: CheckoutTemplate, paymentData: any): string {
    const { colors, logo, layout, customFields, buttons } = template.template;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Checkout - ${paymentData.merchantName}</title>
          <style>
            :root {
              --color-primary: ${colors.primary};
              --color-secondary: ${colors.secondary};
              --color-background: ${colors.background};
              --color-text: ${colors.text};
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background-color: var(--color-background);
              color: var(--color-text);
              margin: 0;
              padding: 20px;
            }
            .checkout-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .logo {
              text-align: ${logo?.position || 'center'};
              margin-bottom: 2rem;
            }
            .logo img {
              max-height: 60px;
            }
            .form-group {
              margin-bottom: 1rem;
            }
            .form-label {
              display: block;
              margin-bottom: 0.5rem;
              font-weight: 500;
            }
            .form-input {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .button {
              background: var(--color-primary);
              color: white;
              padding: 1rem 2rem;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              width: 100%;
              font-size: 1rem;
              font-weight: 600;
            }
            .button.outlined {
              background: transparent;
              border: 2px solid var(--color-primary);
              color: var(--color-primary);
            }
          </style>
        </head>
        <body>
          <div class="checkout-container">
            ${logo ? `
              <div class="logo">
                <img src="${logo.url}" alt="Merchant Logo">
              </div>
            ` : ''}
            
            <form id="checkout-form">
              ${customFields.map(field => `
                <div class="form-group">
                  <label class="form-label" for="${field.name}">${field.label}</label>
                  ${this.renderFormField(field)}
                </div>
              `).join('')}
              
              <button type="submit" class="button ${buttons.style}">
                ${buttons.text}
              </button>
            </form>
          </div>

          <script>
            document.getElementById('checkout-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              // Add payment processing logic here
            });
          </script>
        </body>
      </html>
    `;
  }

  private renderFormField(field: { 
    name: string; 
    type: string; 
    required?: boolean; 
    options?: string[];
  }): string {
    switch (field.type) {
      case 'select':
        return `
          <select name="${field.name}" class="form-input" ${field.required ? 'required' : ''}>
            ${field.options?.map((optionValue: string) => `
              <option value="${optionValue}">${optionValue}</option>
            `).join('')}
          </select>
        `;
      case 'checkbox':
        return `
          <input
            type="checkbox"
            name="${field.name}"
            id="${field.name}"
            ${field.required ? 'required' : ''}
          >
        `;
      default:
        return `
          <input
            type="${field.type}"
            name="${field.name}"
            id="${field.name}"
            class="form-input"
            ${field.required ? 'required' : ''}
          >
        `;
    }
  }
}