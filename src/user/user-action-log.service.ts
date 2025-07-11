import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserActionLog,
  UserActionLogDocument,
} from './entities/user-action-log.schema';
import { UserActionType } from './entities/user-action-type.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TokenBookmarkedEvent,
  TokenUnbookmarkedEvent,
  TokenLikedEvent,
  TokenUnlikedEvent,
  TokenViewedEvent,
} from 'src/events/events';
import { EventNames } from 'src/events/names';

@Injectable()
export class UserActionLogService {
  constructor(
    @InjectModel(UserActionLog.name)
    private userActionLogModel: Model<UserActionLogDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async logAction(userId: string, tokenId: string, actionType: UserActionType) {
    // Check if the action already exists for the user and token
    const existingAction = await this.userActionLogModel.findOne({
      user: userId,
      token: tokenId,
      actionType,
    });

    // if (!existingAction) {
      // create a new log for user action
      const log = new this.userActionLogModel({
        user: userId,
        token: tokenId,
        actionType,
      });

      await log.save();

      switch (actionType) {
        case UserActionType.VIEW:
          this.eventEmitter.emit(
            EventNames.TOKEN_VIEW,
            new TokenViewedEvent(tokenId, userId),
          );
          break;

        case UserActionType.LIKE:
          this.eventEmitter.emit(
            EventNames.TOKEN_LIKE,
            new TokenLikedEvent(tokenId, userId),
          );
          break;

        case UserActionType.UNLIKE:
          this.eventEmitter.emit(
            EventNames.TOKEN_UNLIKE,
            new TokenUnlikedEvent(tokenId, userId),
          );
          break;

        case UserActionType.BOOKMARK:
          this.eventEmitter.emit(
            EventNames.TOKEN_BOOKMARK,
            new TokenBookmarkedEvent(tokenId, userId),
          );
          break;
        
        case UserActionType.UNBOOKMARK:
          this.eventEmitter.emit(
            EventNames.TOKEN_UNBOOKMARK,
            new TokenUnbookmarkedEvent(tokenId, userId),
          );
          break;

        default:
          break;
      }

      // if (actionType === UserActionType.VIEW) {
      //   this.eventEmitter.emit(
      //     'token.viewed',
      //     new TokenViewedEvent(tokenId, userId),
      //   );
      // }
    // }
  }
}
