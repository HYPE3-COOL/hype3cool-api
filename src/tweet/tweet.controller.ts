import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { TweetService } from './tweet.service';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { UpdateTweetDto } from './dto/update-tweet.dto';
import { Public } from 'src/common/decorators';
import { AgentService } from 'src/agent/agent.service';

import { character } from './data/character1';
import { AiService } from 'src/ai/ai.service';

@Controller('tweet')
export class TweetController {
  private readonly logger = new Logger(TweetController.name);

  constructor(
    private readonly tweetService: TweetService,
    private readonly aiService: AiService
  ) {}

}
