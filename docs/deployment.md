# Deployment Guide

## Prerequisites

- AWS Account with appropriate permissions
- Terraform installed
- Docker installed
- AWS CLI configured

## Infrastructure Setup

1. Initialize Terraform:
```bash
cd terraform
terraform init
```

2. Create infrastructure:
```bash
terraform plan -out=tfplan
terraform apply tfplan
```

## Application Deployment

1. Build Docker image:
```bash
docker build -t pi-payment-gateway .
```

2. Tag and push to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPO
docker tag pi-payment-gateway:latest $ECR_REPO/pi-payment-gateway:latest
docker push $ECR_REPO/pi-payment-gateway:latest
```

## Scaling Guidelines

### Horizontal Scaling

To scale the application horizontally:

1. Update the `app_count` variable in Terraform:
```hcl
variable "app_count" {
  default = 4  # Increase number of instances
}
```

2. Apply changes:
```bash
terraform apply
```

### Vertical Scaling

To scale vertically, update the ECS task definition:

```hcl
resource "aws_ecs_task_definition" "app" {
  cpu    = 512    # Increase CPU units
  memory = 1024   # Increase memory
}
```

## Monitoring

1. Set up CloudWatch dashboards
2. Configure alarms for:
   - CPU utilization
   - Memory usage
   - Error rates
   - Response times

## Backup Procedures

1. Database backups:
   - Automated daily backups
   - Manual backups before major changes
   - Verify backup integrity regularly

2. Configuration backups:
   - Store infrastructure code in version control
   - Back up environment variables
   - Document all custom configurations

## Security Considerations

1. Network Security:
   - Use security groups to restrict access
   - Enable VPC flow logs
   - Implement WAF rules

2. Application Security:
   - Regular security updates
   - Enable audit logging
   - Monitor for suspicious activities

## Troubleshooting

1. Check application logs:
```bash
aws logs get-log-events --log-group-name /ecs/pi-payment-gateway
```

2. Monitor ECS service status:
```bash
aws ecs describe-services --cluster pi-payment-gateway-cluster --services pi-payment-gateway-service
```

3. Check container health:
```bash
aws ecs describe-container-instances --cluster pi-payment-gateway-cluster
```