import {
  Body,
  Controller,
  FileTypeValidator,
  HttpStatus,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Public } from 'src/common/decorators';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as path from 'path';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('upload')
export class UploadController {

  private readonly cdnHost

  constructor(
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {
    this.cdnHost = this.configService.get<string>('CDN_HOST'); // Get CDN_HOST from the ConfigService
  }

  @Post()
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 1000 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Res() res,
  ) {
    const defaultFolder = 'uploads'
    // how to generate new filename with extension from the original filename, the filename use uuid
    const filename = `${uuidv4()}.${file.mimetype.split('/')[1]}`;
    const isUploaded = await this.uploadService.upload(filename, defaultFolder, file.buffer);

    if (isUploaded) {
      res.status(HttpStatus.ACCEPTED).json({
        data: {
          message: 'File uploaded successfully',
          url: `${this.cdnHost}/${defaultFolder}/${filename}`,
        },
        status: 'success',
      });
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({
        data: {
          message: 'Error uploading file',
        },
        status: 'error',
      });
    }
  }


  @Post('url')
  @ApiBearerAuth()
  async uploadFileFromUrl(@Body('url') url: string, @Res() res) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const extension = path.extname(url).split('.').pop();
      const filename = `${uuidv4()}.${extension}`;
      const defaultFolder = 'uploads';
      const isUploaded = await this.uploadService.upload(filename, defaultFolder, buffer);

      if (isUploaded) {
        res.status(HttpStatus.ACCEPTED).json({
          data: {
            message: 'File uploaded successfully',
            filename,
          },
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          data: {
            message: 'File upload failed',
          },
        });
      }
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({
        data: {
          message: 'Failed to download image from URL',
        },
      });
    }
  }
}
