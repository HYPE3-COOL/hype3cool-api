import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Req,
  Res,
  HttpStatus,
  Query,
  UnauthorizedException,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { UserService } from './user.service';

import { UpdateUserDto } from './dto/update-user.dto';

import { Public, SetResponse } from 'src/common/decorators';

import { UpdateUserTwitterProfileDto } from './dto';

import mongoose from 'mongoose';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { CreatorService } from 'src/creator/creator.service';

@Controller('users')
@ApiTags('User')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly creatorService: CreatorService,
  ) {}

  @Public()
  @Get('/username/:username')
  @ApiOperation({ summary: 'Get user details by username' })
  // @HttpCode(200)
  @UseInterceptors(ResponseInterceptor)
  @SetResponse('Get user details by username', 'success')
  async findOneByUsername(@Param('username') username: string, @Res() res) {
    this.logger.log(`get user by username ${username}`);
    const user = await this.userService.findByUsername(username);
    res.status(HttpStatus.OK).json({
      data: user,
      status: 'success',
    });
  }

  @Get()
  @Public()
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'List users' })
  @ApiQuery({
    name: 'search',
    type: String,
    description: 'Text to search users (name, username, displayName)',
    required: false,
  })
  @ApiQuery({
    name: 'fields',
    type: String,
    description: 'Field(s) to show details, separated by comma',
    required: false,
    example: 'email,wallet',
  })
  @ApiQuery({
    name: 'twitterName',
    type: String,
    description: 'Search only by twitter username',
    required: false,
  })
  async findAll(
    @Query('search') search = '',
    @Query('fields') fields: string,
    @Query('twitterName') twitterName: string,
    @Req() req,
    @Res() res: any,
  ) {
    let query: any = {};

    if (twitterName != undefined && twitterName != '') {
      // If twitterName is provided, only search by twitter.username
      query = {
        'twitter.username': { $regex: twitterName, $options: 'i' },
      };
    } else if (search != '') {
      // Default search behavior
      query = {
        $or: [
          { username: { $regex: search.toLocaleLowerCase(), $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } },
        ],
      };
    } else {
      res.status(HttpStatus.OK).json({
        data: [],
        status: 'success',
      });
    }

    // if (search) {
    //   query = {
    //     $or: [
    //       { username: { $regex: search.toLocaleLowerCase(), $options: 'i' } },
    //       { displayName: { $regex: search, $options: 'i' } },
    //       // { description: { "$regex": search, "$options": "i" } }
    //     ],
    //   };
    // }

    const docs = await this.userService.findAll(
      query,
      fields ? fields.split(',') : [],
    );
    res.status(HttpStatus.OK).json({
      data: docs,
      status: 'success',
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user details' })
  async findOne(@Param('id') id: string, @Res() res) {
    const _doc = await this.userService.findOneById(id);
    res.status(HttpStatus.OK).json({
      data: _doc,
      status: 'success',
    });
  }

  // @Public()
  // @Get('/getProfile/:userIdOrUsername')
  // @ApiOperation({ summary: 'Get user profile by id or username [public]' })
  // async findOneProfile(
  //   @Param('userIdOrUsername') userIdOrUsername: string,
  //   @Res() res,
  // ) {
  //   let user;
  //   let fullUser;

  //   if (this.helperService.isMongoId(userIdOrUsername)) {
  //     user = await this.userService.findOneById(userIdOrUsername);
  //     fullUser = await this.userService.findOneWithDetails(userIdOrUsername);
  //   } else {
  //     user = await this.userService.findOne({
  //       username: userIdOrUsername,
  //     });

  //     fullUser = await this.userService.findOneWithDetails({
  //       username: userIdOrUsername,
  //     });
  //   }

  //   // get coin created by user
  //   const coins = await this.coinService.findAll(
  //     { creator: user._id },
  //     { createdAt: -1 },
  //   );

  //   if (!user) {
  //     throw new NotFoundException('User is not found!');
  //   }

  //   // want to get the details of favouite tokens how?
  //   // const favoriteTokens = await this.tokenService.findManyByIds(user.favoriteTokens);

  //   res.status(HttpStatus.OK).json({
  //     data: {
  //       _id: user._id,
  //       uid: user.uid,
  //       username: user.username,
  //       displayName: user.displayName,
  //       image: user.image,
  //       walletAddresses: user.walletAddresses,
  //       twitter: user.twitter,
  //       favoriteTokens: user.favoriteTokens,
  //       favouriteTokenDetails: fullUser.favoriteTokens,
  //       oauthProvider: user.oauthProvider,
  //       createdCoins: coins,
  //     },
  //     status: 'success',
  //   });
  // }

  /**
   * Update user's profile
   * @param id
   * @param updateUserDto
   * @param req
   * @param res
   */
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user's profile" })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    // check if user
    if (req.user.id != id) {
      throw new UnauthorizedException('Cannot edit another profile');
    }

    // check if the username is already taken (except the current user)
    if (updateUserDto.username) {
      const user = await this.userService.findOne({
        _id: {
          $ne: new mongoose.Types.ObjectId(id), // req.user.
        },
        username: updateUserDto.username,
      });

      if (user) {
        throw new UnauthorizedException('Username is already taken');
      }
    }

    const user = await this.userService.update(id, updateUserDto);
    res.status(HttpStatus.ACCEPTED).json({
      data: user,
      status: 'success',
    });
  }

  /**
   * Skip twitter notification for first login
   * @param id
   * @param updateUserDto
   * @param req
   * @param res
   */
  @Put(':id/skip-twitter-notification')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Skip twitter notification for first login' })
  async skipTwitterAfterPrivySignUp(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    // check if user
    if (req.user.id != id) {
      throw new UnauthorizedException('Cannot edit another profile');
    }

    const user = await this.userService.update(id, {});
    res.status(HttpStatus.ACCEPTED).json({
      data: user,
      status: 'success',
    });
  }

  @Post('/:id/updateTwitterProfile')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user's twitter profile" })
  async updateTwitterProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserTwitterProfileDto,
    @Req() req,
    @Res() res,
  ) {
    if (req.user.id != id) {
      throw new UnauthorizedException('Failed to verify twitter');
    }

    const user = await this.userService.updateTwitterProfile(id, dto);
    const creator = await this.creatorService.link(user);

    res.status(HttpStatus.OK).json({
      data: {
        user,
      },
      status: 'success',
    });
  }

  // delete twitter profile (twitter object from user document)
  @Delete('/:id/twitter')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user twitter profile' })
  async deleteTwitterProfile(@Param('id') id: string, @Req() req, @Res() res) {
    if (req.user.id != id) {
      throw new UnauthorizedException('Failed to remove twitter profile');
    }

    const user = await this.userService.deleteTwitterProfile(id);

    if (user) {
      // first check if creator exists
      await this.creatorService.unlink(user.id);
    }

    res.status(HttpStatus.OK).json({
      data: user,
      status: 'success',
    });
  }

  // // @Delete(':id')
  // // remove(@Param('id') id: string) {
  // //   return this.userService.remove(id);
  // // }

  // @Post('/:id/role/:roleId')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Attach role to user [only super user]' })
  // async attachRole(
  //   @Param('id') id: string,
  //   @Param('roleId') roleId: string,
  //   @Req() req: any,
  //   @Res() res: any,
  // ) {
  //   // check if user is super admin
  //   if (!req.user?.isBusiness) {
  //     throw new UnauthorizedException();
  //   }

  //   const isUpdated = await this.userService.attachRole(id, roleId);
  //   if (isUpdated) {
  //     const doc = await this.userService.findOneById(id);
  //     res.status(HttpStatus.ACCEPTED).json({
  //       data: doc,
  //       status: 'success',
  //     });
  //   } else {
  //     res.status(HttpStatus.BAD_REQUEST).json({
  //       isUpdated: false,
  //     });
  //   }
  // }

  // @Delete('/:id/role/:roleId')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Detach role to user [only super user]' })
  // async detachRole(
  //   @Param('id') id: string,
  //   @Param('roleId') roleId: string,
  //   @Req() req: any,
  //   @Res() res: any,
  // ) {
  //   // check if user is super admin
  //   if (!req.user?.isBusiness) {
  //     throw new UnauthorizedException();
  //   }

  //   const isUpdated = await this.userService.detachRole(id, roleId);
  //   if (isUpdated) {
  //     const doc = await this.userService.findOneById(id);
  //     res.status(HttpStatus.ACCEPTED).json({
  //       data: doc,
  //       status: 'success',
  //     });
  //   } else {
  //     res.status(HttpStatus.BAD_REQUEST).json({
  //       isUpdated: false,
  //     });
  //   }
  // }

  // @Post('/agora_rtc_token')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get Agora RTC token' })
  // async getAgoraRtcToken(
  //   @Body() getAgoraTokenDto: GetAgoraTokenDto,
  //   @Req() req,
  //   @Res() res,
  // ) {
  //   if (req.user) {
  //     const user = await this.userService.findOneById(req.user?.id);

  //     if (!user) {
  //       throw new NotFoundException(`No user is found`);
  //     }

  //     const rtcToken = await this.agoraService.getAgoraRtcToken(
  //       getAgoraTokenDto.channelName,
  //       user.username,
  //     );

  //     res.status(HttpStatus.OK).json({
  //       data: {
  //         rtcToken,
  //         username: user.username,
  //       },
  //       status: 'success',
  //     });
  //   }
  // }

  // @Post('/agora_rtm_token')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get Agora RTM token' })
  // async getAgoraRtmToken(@Req() req, @Res() res) {
  //   if (req.user) {
  //     const user = await this.userService.findOneById(req.user?.id);

  //     if (!user) {
  //       throw new NotFoundException(`No user is found`);
  //     }

  //     const rtmToken = await this.agoraService.getAgoraRtmToken(user.uid);

  //     res.status(HttpStatus.OK).json({
  //       data: {
  //         rtmToken,
  //         uid: user.uid,
  //       },
  //       status: 'success',
  //     });
  //   }
  // }
}
