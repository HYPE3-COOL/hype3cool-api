import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ConfigKey } from 'src/common/constants';
import { Config, ConfigDocument } from 'src/common/schemas/config.schema';
import { TokenDocument } from 'src/token/entities/token.schema';

@Injectable()
export class HealthService {
  constructor(
    @InjectModel('Config')
    private readonly configModel: Model<ConfigDocument>,
  ) {}

  async getVersion() {
    try {
      const apiVersion = await this.configModel.findOne({
        name: ConfigKey.API_VERSION,
      });
      const frontendVersion = await this.configModel.findOne({
        name: ConfigKey.FRONTEND_VERSION,
      });

      return {
        api: {
          version: apiVersion.valueInString,
        },
        frontend: {
          version: frontendVersion.valueInString,
        },
      };
    } catch (error) {
      console.log(error);
    }
  }

  async getSolana() {
    try {
      // find the solana config by name if name = ConfigKey.SOL_MARKET_PRICE or ConfigKey.SOL_TPS
      const solanaConfig = await this.configModel.find({
        name: { $in: [ConfigKey.SOL_MARKET_PRICE, ConfigKey.SOL_TPS] },
      });

      return {
        priceInUsd: solanaConfig.find(
          (config) => config.name === ConfigKey.SOL_MARKET_PRICE,
        )?.value,
        tps: solanaConfig.find((config) => config.name === ConfigKey.SOL_TPS)
          ?.value,
        network: process.env.NODE_ENV == 'production' ? 'mainnet' : 'devnet',
      };
    } catch (error) {
      console.log(error);
    }
  }
}
