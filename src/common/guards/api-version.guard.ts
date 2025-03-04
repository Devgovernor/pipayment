import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_VERSION_KEY } from '../decorators/api-version.decorator';

@Injectable()
export class ApiVersionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const version = this.reflector.get<string>(API_VERSION_KEY, context.getHandler());
    
    if (!version) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const requestVersion = request.headers['api-version'];

    return version === requestVersion;
  }
}