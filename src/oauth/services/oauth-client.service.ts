import { Injectable } from '@nestjs/common';

import {
  generatePublicPrivateKeyPair,
  generateRandomString,
} from 'src/common/util/crypto-util';
import { Model } from 'mongoose';
import { ConfigDocument } from 'src/common/schemas/config.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class OauthClientService {
  constructor(
    @InjectModel('Config')
    private readonly configModel: Model<ConfigDocument>,
    //     @InjectRepository(OauthClient)
    //     public readonly repo: Repository<OauthClient>,
  ) {
    //     super(repo);
  }

  async generateClient(): Promise<any> {
    const client_id = generateRandomString(32);
    const client_secret = generateRandomString(64);

    const session = await this.configModel.db.startSession();
    session.startTransaction();

    try {
      await this.configModel.findOneAndUpdate(
        { name: 'ELIZA_CLIENT_ID', description: 'Client ID for Eliza' },
        { valueInString: client_id },
        { new: true, upsert: true, session },
      );

      await this.configModel.findOneAndUpdate(
        { name: 'ELIZA_CLIENT_SECRET', description: 'Client Secret for Eliza' },
        { valueInString: client_secret },
        { new: true, upsert: true, session },
      );

      await session.commitTransaction();
      session.endSession();

      return {
        client_id,
        client_secret,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async validateClient(clientId: string, clientSecret: string): Promise<boolean> {
    const clientIdConfig = await this.configModel.findOne({ name: 'ELIZA_CLIENT_ID' }).exec();
    const clientSecretConfig = await this.configModel.findOne({ name: 'ELIZA_CLIENT_SECRET' }).exec();

    if (!clientIdConfig || !clientSecretConfig) {
      return false;
    }

    const isClientIdValid = clientIdConfig.valueInString === clientId;
    const isClientSecretValid = clientSecretConfig.valueInString === clientSecret;

    return isClientIdValid && isClientSecretValid;
  }
}
