import { Injectable, Logger } from '@nestjs/common';

import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { TokenDocument } from './entities/token.schema';

// solana
import { SolanaService } from 'src/services/solana.service';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @InjectConnection()
    private readonly connection: mongoose.Connection,
    @InjectModel('Token')
    private readonly tokenModel: Model<TokenDocument>,
    private readonly solanaService: SolanaService,
  ) {}

  async findAll(data: {
    query: any;
    sort?: any;
    page?: number;
    limit?: number;
    fields?: string[];
  }): Promise<TokenDocument[]> {
    const { query, sort, page, limit, fields } = data;

    return await this.tokenModel.find().select('-rawData').exec();
    // return await this.tokenModel
    //   .find(query)
    //   .skip((page - 1) * limit)
    //   .limit(limit)
    //   .sort(sort ?? { createdAt: -1 })
    //   .exec();
  }

  async createOrUpdateTokenFromHelius(address: string, data: any) {
    const { content, token_info } = data;

    if (!content || !token_info) {
      return;
    }

    const name = content?.metadata?.name || '';
    const symbol = content?.metadata?.symbol || '';
    const description = content?.metadata?.description || '';
    const imageUri = content?.links?.image || '';

    // check if token exists
    const existingToken = await this.tokenModel.findOne({ address: address });

    if (existingToken) {
      const token = await this.tokenModel.findOneAndUpdate(
        { address: address },
        {
          address: address,
          symbol: symbol,
          name: name,
          description: description,
          imageUri: imageUri,
          tokenInfo: token_info,
          rawData: data,
        },
        { new: true, upsert: true },
      );
      return token;
    } else {
      // Create token
      const token = await this.tokenModel.create({
        address: address,
        symbol: symbol,
        name: name,
        description: description,
        imageUri: imageUri,
        tokenInfo: token_info,
        rawData: data,
      });
      return token;
    }
  }

  // list all tokens and update market data
  async updateAllMarketData() {
    const tokens = await this.tokenModel.find();

    for (const token of tokens) {
      const meta = await this.solanaService.getTokenMetadata(token.address);
      await this.createOrUpdateTokenFromHelius(token.address, meta?.result);

      // delay 3s between each request
      await new Promise((resolve) => setTimeout(resolve, 3000));
      this.logger.log(`Update token ${token.symbol} market data`);
    }
  }

  async updateMarketData(tokenAddress: string) {
    const token = await this.tokenModel.findOne({ address: tokenAddress });

    if (!token) {
      return;
    }

    const meta = await this.solanaService.getTokenMetadata(token.address);
    await this.createOrUpdateTokenFromHelius(token.address, meta?.result);
    this.logger.log(`Update token ${token.symbol} market data`);
  }
}
