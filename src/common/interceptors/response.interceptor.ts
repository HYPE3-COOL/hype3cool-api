import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
    RESPONSE_METADATA,
    ResponseMeta,
} from '../decorators/response-metadata.decorator';

export interface StandardResponse<T> {
    data: T;
    status: string;
    message: string;
    error: string | null;
}

@Injectable()
export class ResponseInterceptor<T>
    implements NestInterceptor<T, StandardResponse<T>>
{
    constructor(private reflector: Reflector) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<StandardResponse<T>> {
        const responseMeta = this.reflector.get<ResponseMeta>(
            RESPONSE_METADATA,
            context.getHandler(),
        ) || {
            message: 'Success',
            status: 'success',
        };

        return next.handle().pipe(
            map((data) => ({
                data: data || {}, // Ensure data is an object
                status: responseMeta.status,
                message: responseMeta.message,
                error: null,
            })),
            catchError((err) => {
                // Handle errors here
                const response = {
                    data: null,
                    status: 'error',
                    message: err.message || 'An unexpected error occurred',
                    error: err.response ? err.response : err.message, // Customize as needed
                };

                // Return a formatted error response
                return throwError(() => new HttpException(response, err.status || 500));
            }),
        );
    }
}