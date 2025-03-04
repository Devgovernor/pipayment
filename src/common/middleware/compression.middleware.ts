import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  private compress: ReturnType<typeof compression>;

  constructor() {
    this.compress = compression({
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6, // Compression level
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.compress(req, res, next);
  }
}