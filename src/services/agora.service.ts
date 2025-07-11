import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  RtcTokenBuilder,
  RtmTokenBuilder,
  RtcRole,
  // RtmRole,
} from 'agora-token';

@Injectable()
export class AgoraService {
  private readonly appID: string;
  private readonly appCertificate: string;
  private readonly app_id: string;

  constructor(private readonly configService: ConfigService) {
    this.appID = this.configService.get<string>('AGORA_APP_ID');
    this.appCertificate = this.configService.get<string>('AGORA_APP_CERT');
  }

  // https://github.com/AgoraIO/Tools/blob/master/DynamicKey/AgoraDynamicKey/nodejs/sample/RtcTokenBuilderSample.js
  async getAgoraRtcToken(
    channelName: string,
    username: string,
  ): Promise<string | null> {
    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expirationTimeInSeconds =
        this.configService.get<string>('AGORA_EXP_DURATION');
      const privilegeExpiredTs =
        currentTimestamp + parseInt(expirationTimeInSeconds);

      // Build token with user account
      return RtcTokenBuilder.buildTokenWithUserAccount(
        this.appID,
        this.appCertificate,
        channelName,
        username,
        RtcRole.PUBLISHER,
        parseInt(expirationTimeInSeconds),
        privilegeExpiredTs,
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getAgoraRtmToken(uid: number): Promise<string | null> {
    try {
      const expirationTimeInSeconds =
        this.configService.get<string>('AGORA_EXP_DURATION');

      // Build token with user account
      return RtmTokenBuilder.buildToken(
        this.appID,
        this.appCertificate,
        uid.toString(),
        3600,
      );
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error);
    }
  }
}
