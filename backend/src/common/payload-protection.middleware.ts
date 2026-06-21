import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PayloadProtectionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Query String Length Check
    const queryString = req.originalUrl.split('?')[1] || '';
    if (queryString.length > 4096) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid Request Structure: Query string exceeds maximum length of 4096 characters.',
      });
      return;
    }

    // 2. Body Existence Check
    if (req.body && typeof req.body === 'object') {
      try {
        const visited = new Set<any>();
        this.validateObject(req.body, 1, visited);
      } catch (err: any) {
        if (err.message.includes('depth')) {
          res.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Invalid Request Structure: JSON nesting depth exceeds limit of 20.',
          });
          return;
        }
        if (err.message.includes('array')) {
          res.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
            statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
            message: 'Payload Too Large: Array size exceeds limit of 1000.',
          });
          return;
        }
        if (err.message.includes('circular')) {
          res.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Invalid Request Structure: Circular references detected.',
          });
          return;
        }
        if (err.message.includes('pollution')) {
          res.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Invalid Request Structure: Prototype pollution detected.',
          });
          return;
        }
        res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Invalid Request Structure: ${err.message}`,
        });
        return;
      }
    }

    next();
  }

  private validateObject(obj: any, currentDepth: number, visited: Set<any>) {
    if (currentDepth > 20) {
      throw new Error('depth limit exceeded');
    }

    if (obj === null || typeof obj !== 'object') {
      return;
    }

    if (visited.has(obj)) {
      throw new Error('circular reference');
    }
    visited.add(obj);

    if (Array.isArray(obj)) {
      if (obj.length > 1000) {
        throw new Error('array limit exceeded');
      }
      for (const item of obj) {
        this.validateObject(item, currentDepth + 1, new Set(visited));
      }
    } else {
      for (const key of Object.keys(obj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          throw new Error('prototype pollution');
        }
        this.validateObject(obj[key], currentDepth + 1, new Set(visited));
      }
    }
  }
}
