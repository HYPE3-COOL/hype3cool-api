import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  Headers,
  Param,
  NotFoundException,
  UseGuards,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from './entities/auth.entity';
import { Public } from 'src/common/decorators';

import { CreateWithdrawDto } from './dto';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import { PrivyAuthGuard } from './guards';
import { UserService } from 'src/user/user.service';
import { CreatorService } from 'src/creator/creator.service';
import { OauthClientService } from 'src/oauth/services/oauth-client.service';
import { PrivyService } from 'src/modules/privy/privy.service';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly creatorService: CreatorService,
    private readonly oauthClientService: OauthClientService,
    private readonly privyService: PrivyService,
  ) {}

  // @Public()
  // @UseGuards(RefreshJwtGuard)
  // @Post('refresh')
  // @ApiOperation({ summary: 'Refresh access token if expire' })
  // async refreshToken(@Req() req: any) {
  //   return await this.authService.refreshToken(req.user);
  // }

  @Public()
  @Post('signup/privy')
  @ApiOperation({ summary: 'Sign up by privy' })
  async signUpByPrivy(@Req() req) {
    const [type, token] = req.headers['authorization'].split(' ') ?? [];
    if (!token || type !== 'Bearer') {
      throw new UnauthorizedException();
    }

    const verifiedClaims = await this.authService.verifyPrivyToken(token);
    if (!verifiedClaims) {
      throw new UnauthorizedException();
    }

    return await this.authService.signUpByPrivy(verifiedClaims.userId);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get authenticated user's profile" })
  async findMe(@Req() req, @Res() res) {
    this.logger.log('get profile');
    if (req.user) {
      const doc = await this.userService.findOneById(req.user?.id);

      res.status(HttpStatus.OK).json({
        data: doc,
        status: 'success',
      });
    }
  }

  // link as creator
  @Post('/creator/link')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Link authenticated user as creator',
  })
  async linkAsCreator(@Req() req: any, @Res() res: any) {
    const user = await this.userService.findOneById(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const creator = await this.creatorService.link(user);

    res.status(HttpStatus.ACCEPTED).json({
      data: creator,
      status: 'success',
    });
  }

  // unlink as creator
  @Post('/creator/unlink')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unlink authenticated user as creator',
  })
  async unlinkAsCreator(@Req() req: any, @Res() res: any) {
    const creator = await this.creatorService.unlink(req.user.id);

    res.status(HttpStatus.ACCEPTED).json({
      data: creator,
      status: 'success',
    });
  }

  @Get('/creator/holdings')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get outstanding balance of linked creator account',
  })
  async getHoldings(@Req() req: any, @Res() res: any) {
    const creator = await this.creatorService.getHoldings(req.user.id);

    res.status(HttpStatus.ACCEPTED).json({
      data: creator,
      status: 'success',
    });
  }

  /**
   * Create new withdrawal of holdings
   * @param id
   * @param CreateWithdrawDto
   * @param req
   * @param res
   */
  @Post('/creator/holdings/withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new withdrawal of holdings' })
  async withdraw(
    @Body() dto: CreateWithdrawDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    const withdrawal = await this.creatorService.withdraw(req.user.id, dto);

    res.status(HttpStatus.ACCEPTED).json({
      data: withdrawal,
      status: 'success',
    });
  }

  // @Public()
  // @Post('admin/generate_client')
  // @ApiOperation({ summary: 'Generate OAuth client' })
  // async generateClient(@Req() req: any, @Res() res: any) {
  //   const client = await this.oauthClientService.generateClient();
  //   res.status(HttpStatus.OK).json({
  //     status: 'success',
  //     data: client,
  //   });
  // }

  // @Public()
  // @Post('admin/generate_privy_user')
  // @ApiOperation({ summary: 'Generate Privy User' })
  // async generateClient(@Req() req: any, @Res() res: any) {
  //   const privyUser =
  //     await this.privyService.pregenerateAdminPrivyUser('support@hype3.cool');

  //   res.status(HttpStatus.OK).json({
  //     data: privyUser,
  //     status: 'success',
  //   });
  // }

  // @Public()
  // @Post('admin/generate_privy_user_by_twitter')
  // @ApiOperation({ summary: 'Generate Privy User By Twitter' })
  // async generateClientByTwitter(@Req() req: any, @Res() res: any) {
  //   const creators = await this.creatorService.findAll({
  //     query: {},
  //   });

  //   // loop through creators and link them to privy
  //   for (const creator of creators) {
  //     const privyUser = await this.privyService.getUserByTwitterId(
  //       creator.twitter.id,
  //     );

  //     if (!privyUser) {
  //       console.log(`privy user not found, so create one for this user ${creator.twitter.username} [${creator.twitter.id}]`);
  //       const newPrivyUser = await this.privyService.pregeneratePrivyUserByTwitter(
  //         {
  //           id: creator.twitter.id,
  //           name: creator.twitter.name,
  //           username: creator.twitter.username,
  //           image: creator.twitter.image,
  //         },
  //       );

  //       console.log(`privy user created for ${newPrivyUser.id} ${newPrivyUser.username}`);
  //       continue;
  //     } else {
  //       // console.log(`privy user found for ${creator.twitter.username} [${creator.twitter.id}]`);
  //     }
  //     // await this.userService.linkAccount(user.id, {
  //     //   type: 'twitter_oauth',
  //     //   id: user.twitter.id,
  //     // });
  //   }

  //   // const privyUser = await this.privyService.pregeneratePrivyUserByTwitter({
  //   //   id: '1325987320047181825',
  //   //   name: 'martin',
  //   //   username: 'martin17063682',
  //   //   image:
  //   //     'https://pbs.twimg.com/profile_images/1325987931585011712/792yimdW.jpg',
  //   // });

  //   res.status(HttpStatus.OK).json({
  //     data: creators,
  //     count: creators.length,
  //     status: 'success',
  //   });
  // }

  // @Public()
  // @Post('admin/link-privy-twitter-to-verified')
  // @ApiOperation({ summary: 'Link Privy Twitter User to Verified User' })
  // async testTransferToken(@Req() req: any, @Res() res: any) {
  //   const users = await this.userService.findAll(
  //     {
  //       twitter: { $exists: true },
  //       'linkedAccounts.type': { $ne: 'twitter_oauth' },
  //     },
  //     ['twitter'],
  //   );

  //   for (const user of users) {
  //     const privyUser = await this.privyService.getUserByTwitterId(user.twitter.id);
  //     if (!privyUser) {
  //       console.log(`privy user not found, so create one for this user ${user.twitter.username} [${user.twitter.id}]`);
  //       continue;
  //     } else {
  //       console.log(`privy user found for ${user.twitter.username} [${user.twitter.id}]`);
  //     }
  //     // await this.userService.linkAccount(user.id, {
  //     //   type: 'twitter_oauth',
  //     //   id: user.twitter.id,
  //     // });
  //   }

  //   res.status(HttpStatus.OK).json({
  //     data: users,
  //     length: users.length,
  //     status: 'success',
  //   });
  // }

  // @Public()
  // @Post('admin/add_privy_embedded')
  // @ApiOperation({ summary: 'Add Privy embedded wallet to existing privy user' })
  // async generateClient(@Req() req: any, @Res() res: any) {
  //   const privyUser =
  //     await this.privyService.addPrivyEmbeddedByPrivyUserId('did:privy:cm76a1sor037nw52f7n2pjrij')
  //       // .pregenerateAdminPrivyUser('support@hype3.cool');

  //   res.status(HttpStatus.OK).json({
  //     data: privyUser,
  //     status: 'success',
  //   });
  // }
}
