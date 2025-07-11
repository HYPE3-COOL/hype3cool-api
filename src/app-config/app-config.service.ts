import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigDocument } from 'src/common/schemas/config.schema';

@Injectable()
export class AppConfigService {
  constructor(
    @InjectModel('Config')
    private readonly configModel: Model<ConfigDocument>,
  ) {}

  async getVault(): Promise<string> {
    const doc = await this.configModel.findOne({ name: 'MAIN_VAULT_WALLET' });
    if (doc) {
      return doc.valueInString;
    }
  }

  async getValue(key: string): Promise<string> {
    const doc = await this.configModel.findOne({ name: key });
    if (doc) {
      return doc.valueInString;
    }
  }

  async getNumberValue(key: string): Promise<number> {
    const doc = await this.configModel.findOne({ name: key });
    if (doc) {
      return doc.value;
    }
  }
}
