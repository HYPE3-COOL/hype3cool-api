import { SetMetadata } from '@nestjs/common';

export const RESPONSE_METADATA = 'responseMeta';

export interface ResponseMeta {
    message: string;
    status: string;
}

export const SetResponse = (message: string, status: string) =>
    SetMetadata(RESPONSE_METADATA, { message, status });
