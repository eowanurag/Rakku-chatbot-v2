import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const host = context.switchToHttp();
    const request = host.getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    console.log(`[HTTP ENTRY] ${method} ${url} - Body: ${JSON.stringify(body || {})}`);

    return next.handle().pipe(
      tap((responseBody) => {
        const duration = Date.now() - now;
        console.log(`[HTTP EXIT] ${method} ${url} - Status: Success - Duration: ${duration}ms`);
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        console.error(`[HTTP ERROR] ${method} ${url} - Duration: ${duration}ms - Error:`, error);
        throw error;
      }),
    );
  }
}
