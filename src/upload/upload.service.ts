import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Readable } from 'stream';

// aws s3
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class UploadService {

  private readonly cdnHost: string;

  private readonly s3Client = new S3Client({
    region: this.configService.getOrThrow('AWS_S3_REGION'),
  });

  constructor(private readonly configService: ConfigService) {
    this.cdnHost = this.configService.get<string>('CDN_HOST');
  }
  // https://www.youtube.com/watch?v=tEZERHLge-U&ab_channel=MichaelGuay
  // https://www.youtube.com/watch?v=s1Tu0yKmDKU&ab_channel=BeABetterDev
  async upload(
    fileName: string,
    folder: string = 'uploads',
    file: Buffer,
  ): Promise<boolean> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: 'hype3-prod-bucket',
          Key: `${folder}/${fileName}`,
          Body: file,
        }),
      );

      return true;
    } catch (error) {
      throw new Error('Error uploading file');
    }
  }

  async uploadStream(
    fileName: string,
    folder: string = 'uploads',
    stream: ReadableStream,
  ): Promise<string> {
    try {
      const nodeStream = await this.convertWebStreamToNode(stream);

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: 'hype3-prod-bucket',
          Key: `${folder}/${fileName}`,
          Body: nodeStream,
          ContentType: 'image/png', // Set based on your file type
        },
      });

      await upload.done();

      return `${this.cdnHost}/${folder}/${fileName}`;
    } catch (error) {
      console.error('Stream upload failed:', error);
      throw new Error('Error uploading stream');
    }
  }

  private async convertWebStreamToNode(webStream: ReadableStream) {
    const reader = webStream.getReader();
    return Readable.from({
      async *[Symbol.asyncIterator]() {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      },
    });
  }
}
