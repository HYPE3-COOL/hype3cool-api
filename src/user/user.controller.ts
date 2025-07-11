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
  ) { }

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
}
