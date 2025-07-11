import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, ClientSession } from 'mongoose';
import { USER_FIELDS } from 'src/common/constants';

import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserAvatarDto,
  CreateUserByWalletDto,
  UpdateUserWalletDto,
  UpdateUserProfileDto,
  CreateAdminDto,
  UpdateUserTwitterProfileDto,
} from './dto';
import { UserDocument } from './entities/user.schema';
import { ConfigDocument } from 'src/common/schemas/config.schema';
import { EventNames } from 'src/events/names';
import { OnEvent } from '@nestjs/event-emitter';
import {
  TokenBookmarkedEvent,
  TokenLikedEvent,
  TokenUnbookmarkedEvent,
  TokenUnlikedEvent,
} from 'src/events/events';


@Injectable()
export class UserService {
  constructor(
    @InjectConnection()
    private readonly connection: mongoose.Connection,
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
    @InjectModel('Config')
    private readonly configModel: Model<ConfigDocument>,
  ) {}

  /**
   *
   * @param dto
   * @returns
   */
  async createAdmin(dto: CreateAdminDto) {
    dto.isAdmin = true;
    return await this.create(dto);
  }

  async create(createUserDto: any) {
    const session = await this.connection.startSession();
    session.startTransaction({ readPreference: 'primary' });
    let userCountConfig;
    // let newUser;

    try {
      userCountConfig = await this.configModel.findOneAndUpdate(
        { name: 'USER_COUNT' },
        { $inc: { value: 1 } },
        { new: true, upsert: true, session },
      );

      // Create a new user with the uid from the USER_COUNT configuration document
      const newUser = await this.userModel.create(
        [
          {
            ...createUserDto,
            _id: new mongoose.Types.ObjectId(),
            uid: userCountConfig.value,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return newUser[0]; // exclude password (set in schema)
    } catch (error) {
      await session.abortTransaction();
      this._handleError(error);
    } finally {
      session.endSession();
    }
  }

  async createBySession(data: any, session: ClientSession): Promise<any> {
    try {
      const userCountConfig = await this.configModel.findOneAndUpdate(
        { name: 'USER_COUNT' },
        { $inc: { value: 1 } },
        { new: true, upsert: true, session },
      );

      const createdDoc = await this.userModel.create(
        [
          {
            ...data,
            uid: userCountConfig.value,
          },
        ],
        { session },
      );

      return createdDoc;
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: any, fields?: string[]): Promise<UserDocument[]> {
    const selectedFields = USER_FIELDS.concat(fields || []);

    // exclude email not yet verified
    query = {
      ...query,
      isEmailVerified: { $ne: false },
    };

    return await this.userModel.find(query).select(selectedFields).exec();
  }

  // return user object with password for validation
  async login(id: string) {
    return await this.userModel.findById(id);
  }

  async findOneById(id: string): Promise<UserDocument> {
    try {
      return await this.userModel.findById(id).select(['-password']);
    } catch (error) {
      this._handleError(error);
    }
  }

  async findOneByPrivyId(privyUserId: string): Promise<any> {
    try {
      return await this.userModel
        .findOne({ privyUserId })
        // .select(['-password']);
      
    } catch (error) {
      throw error;
      // this._handleError(error);
    }
  }

  async findOne(query: any): Promise<UserDocument> {
    try {
      return await this.userModel.findOne(query).exec();
      // .select(['-password']).exec();
      // return await this.userModel
      //   .findOne(query)
      //   .select(['-password']);
    } catch (error) {
      this._handleError(error);
    }
  }

  async findOneWithDetails(query: any): Promise<UserDocument> {
    try {
      return await this.userModel
        .findOne(query)
        .populate('favoriteTokens')
        .exec();
    } catch (error) {
      this._handleError(error);
    }
  }

  async findByUsername(username: string): Promise<UserDocument> {
    try {
      return await this.userModel.findOne({ username: username }).exec();
    } catch (error) {
      this._handleError(error);
    }
  }

  async findOneByUsername(username: string): Promise<UserDocument> {
    return await this.userModel.findOne({ username: username }).exec();
  }

  async update(id: string, data: any): Promise<UserDocument> {
    try {
      const user = await this.userModel.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            ...data,
            isNewUser: false,
          },
        },
        { new: true },
      );
      if (!user) {
        throw new NotFoundException();
      }
      return user;
    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    }
  }

  /**
   * Update user's profile
   * @param id | userId
   * @param updateUserProfileDto
   * @returns
   */
  async updateProfile(
    id: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<boolean> {
    const _update = await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          // isEmailVerified: true,
          // emailVerificationToken: '',
          // emailVerificationExpiredAt: null,
          ...updateUserProfileDto,
        },
      },
    );

    if (!_update) {
      throw new NotFoundException();
    }

    return true;
  }

  /**
   * Update user's twitter profile
   * @param id | userId
   * @param dto | UpdateUserTwitterProfileDto
   * @returns UserDocument
   */
  async updateTwitterProfile(
    id: string,
    dto: UpdateUserTwitterProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          twitter: { ...dto },
          isNewUser: false,
          isCreator: true,      // now will automatically become creator
        },
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  /*
   * Delete twitter profile
   * @param id | userId
   * @returns boolean
   */
  async deleteTwitterProfile(id: string): Promise<UserDocument> {
    const user = await this.userModel.findOneAndUpdate(
      { _id: id },
      {
        $unset: {
          twitter: {},
        },
        isCreator: false,
      },
      { new: true },
    );
    
    return user;
  }

  async updateBySession(
    id: string,
    update: any,
    session: ClientSession,
  ): Promise<boolean> {
    try {
      const _update = await this.userModel.updateOne(
        { _id: id },
        { ...update },
        { session },
      );

      if (!_update) {
        throw new NotFoundException();
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async activate(id: string): Promise<boolean> {
    const _update = await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          isEmailVerified: true,
          emailVerificationToken: '',
          emailVerificationExpiredAt: null,
        },
      },
    );
    if (!_update) {
      throw new NotFoundException();
    }

    return true;
  }

  /**
   * Reset email verification token
   * @param id userId
   * @param emailVerificationToken
   * @param emailVerificationExpiredAt
   * @returns
   */
  async resetEmailVerify(
    id: string,
    emailVerificationToken: string,
    emailVerificationExpiredAt: Date,
  ): Promise<boolean> {
    const _update = await this.userModel.updateOne(
      { _id: id },
      {
        isEmailVerified: false,
        emailVerificationToken: emailVerificationToken,
        emailVerificationExpiredAt: emailVerificationExpiredAt,
      },
    );
    if (!_update) {
      throw new NotFoundException();
    }

    return true;
  }

  /**
   * Forget password, then generate reset password token for further password update
   * @param id userId
   * @param resetPasswordToken
   * @param resetPasswordExpiredAt
   * @returns
   */
  async forgetPassword(
    id: string,
    resetPasswordToken: string,
    resetPasswordExpiredAt: Date,
  ): Promise<boolean> {
    const _update = await this.userModel.updateOne(
      { _id: id },
      {
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpiredAt: resetPasswordExpiredAt,
      },
    );
    if (!_update) {
      throw new NotFoundException();
    }

    return true;
  }

  async resetPassword(id: string, password: string) {
    const _update = await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          password,
          resetPasswordToken: '',
          resetPasswordExpiredAt: null,
        },
      },
    );
    if (!_update) {
      throw new NotFoundException();
    }

    return true;
  }

  // avatar
  async findOneAvatar(id: string): Promise<string> {
    const _user = await this.userModel.findById(id);

    if (!_user) {
      throw new NotFoundException();
    }
    return _user.image ?? '';
  }

  async updateAvatar(
    id: string,
    updateUserAvatarDto: UpdateUserAvatarDto,
  ): Promise<boolean> {
    const _update = await this.userModel.updateOne(
      { _id: id },
      {
        image: updateUserAvatarDto.image,
      },
    );

    if (!_update) {
      throw new NotFoundException();
    }

    return true;
  }

  async updateWallet(
    id: string,
    updateUserWalletDto: UpdateUserWalletDto,
  ): Promise<boolean> {
    try {
      const _update = await this.userModel.updateOne(
        { _id: id },
        {
          wallet: updateUserWalletDto.wallet,
        },
      );

      if (!_update) {
        throw new NotFoundException();
      }

      return true;
    } catch (error) {
      this._handleError(error);
    }
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }

  // attach role to user
  async attachRole(id: string, roleId: string): Promise<boolean> {
    const _update = await this.userModel.updateOne(
      { _id: id },
      {
        $addToSet: { roles: roleId },
      },
    );
    if (!_update) {
      throw new NotFoundException();
    }

    return true;
  }

  // detach role from user
  async detachRole(id: string, roleId: string): Promise<boolean> {
    const _update = await this.userModel.updateOne(
      { _id: id },
      {
        $pull: { roles: roleId },
      },
    );
    if (!_update) {
      throw new NotFoundException();
    }

    return true;
  }

  private _handleError(error: any) {
    Logger.error(error.message);
    if (error.message.includes('User validation failed')) {
      if (error.errors) {
        Object.keys(error.errors).forEach((field) => {
          if (error.errors[field].properties.message.includes('to be unique')) {
            throw new UnprocessableEntityException(
              `${field} is already registered!`,
            );
          }
          throw new UnprocessableEntityException(
            error.errors[field].properties.message,
          );
        });
      }
    } else if (error.message.includes('dup key: { wallet')) {
      throw new UnprocessableEntityException(
        `This wallet address is already registered!`,
      );
    } else if (error.message.includes('Cast to ObjectId failed')) {
      throw new UnprocessableEntityException('Invalid data input');
    } else {
      throw new UnprocessableEntityException(error.message);
    }
  }

  @OnEvent(EventNames.TOKEN_BOOKMARK, { async: true })
  async handleTokenBookmarkedEvent(payload: TokenBookmarkedEvent) {
    try {
      const userId = new mongoose.Types.ObjectId(payload.userId);
      const tokenId = new mongoose.Types.ObjectId(payload.tokenId);
      await this.userModel
        .updateOne(
          { _id: userId },
          { $addToSet: { bookmarkedTokens: tokenId } },
        )
        .exec();
    } catch (error) {
      console.log('Error updating token bookmarked', error);
      console.log({ error });
    }
  }

  @OnEvent(EventNames.TOKEN_UNBOOKMARK, { async: true })
  async handleTokenUnbookmarkedEvent(payload: TokenUnbookmarkedEvent) {
    try {
      const userId = new mongoose.Types.ObjectId(payload.userId);
      const tokenId = new mongoose.Types.ObjectId(payload.tokenId);

      await this.userModel
        .updateOne({ _id: userId }, { $pull: { bookmarkedTokens: tokenId } })
        .exec();
    } catch (error) {
      console.log('Error updating token unbookmarked', error);
      console.log({ error });
    }
  }

  @OnEvent(EventNames.TOKEN_LIKE, { async: true })
  async handleTokenLikedEvent(payload: TokenLikedEvent) {
    try {
      const userId = new mongoose.Types.ObjectId(payload.userId);
      const tokenId = new mongoose.Types.ObjectId(payload.tokenId);

      await this.userModel
        .updateOne({ _id: userId }, { $addToSet: { favoriteTokens: tokenId } })
        .exec();
    } catch (error) {
      console.log('Error updating token liked', error);
      console.log({ error });
    }
  }

  @OnEvent(EventNames.TOKEN_UNLIKE, { async: true })
  async handleTokenUnlikedEvent(payload: TokenUnlikedEvent) {
    try {
      const userId = new mongoose.Types.ObjectId(payload.userId);
      const tokenId = new mongoose.Types.ObjectId(payload.tokenId);

      await this.userModel
        .updateOne({ _id: userId }, { $pull: { favoriteTokens: tokenId } })
        .exec();
    } catch (error) {
      console.log('Error updating token unliked', error);
      console.log({ error });
    }
  }
}
