import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HelperService {
  private readonly cloudinaryName: string;
  private readonly cloudinaryApiKey: string;
  private readonly cloudinaryApiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudinaryName = this.configService.get<string>(
      'CLOUDINARY_CLOUD_NAME',
    );
    this.cloudinaryApiKey =
      this.configService.get<string>('CLOUDINARY_API_KEY');
    this.cloudinaryApiSecret = this.configService.get<string>(
      'CLOUDINARY_API_SECRET',
    );
  }

  // validateWallet(wallet: string): boolean {
  //   try {
  //     const owner = new PublicKey(wallet);
  //     return PublicKey.isOnCurve(owner.toBytes());
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  /**
   * Get GUID
   * @param withoutHyphen
   * @returns
   */
  getUUID(withoutHyphen = false) {
    return withoutHyphen ? uuidv4().replaceAll('-', '') : uuidv4();
  }

  isObjectEmpty = (objectName) => {
    return Object.keys(objectName).length === 0;
  };

  isMongoId = (str) => {
    return str.match(/^[0-9a-fA-F]{24}$/);
  };
}
