import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserService } from 'src/user/user.service';
import { HelperService } from 'src/helper/helper.service';



@Controller('me')
@ApiTags('AuthUser')
@ApiBearerAuth()
export class MeController {
  private readonly logger = new Logger(MeController.name);

  constructor(
    private readonly userService: UserService,
    private readonly helperService: HelperService,
    // private readonly roomUserService: RoomUserService,
  ) {}


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



//   @Post('/update_avatar')
//   @ApiBearerAuth()
//   @ApiOperation({
//     summary: "Update user's avatar",
//   })
//   async updateAvatar(
//     @Body() updateUserAvatarDto: UpdateUserAvatarDto,
//     @Req() req: any,
//     @Res() res: any,
//   ) {
//     const isUpdated = await this.userService.updateAvatar(
//       req.user.id,
//       updateUserAvatarDto,
//     );

//     res.status(HttpStatus.ACCEPTED).json({
//       data: {
//         isUpdated,
//         url: updateUserAvatarDto.avatar,
//       },
//       status: 'success',
//     });
//   }

//   @Post('/')
//   @ApiBearerAuth()
//   @ApiOperation({
//     summary: "Update authenticated user's profile",
//   })
//   async updateProfile(
//     @Body() updateUserProfileDto: UpdateUserProfileDto,
//     @Req() req: any,
//     @Res() res: any,
//   ) {
//     const isUpdated = await this.userService.updateProfile(
//       req.user.id,
//       updateUserProfileDto,
//     );

//     if (isUpdated) {
//       res.status(HttpStatus.ACCEPTED).json({
//         data: {
//           ...updateUserProfileDto,
//         },
//         status: 'success',
//       });
//     } else {
//       res.status(HttpStatus.BAD_REQUEST).json({
//         data: {
//           ...updateUserProfileDto,
//         },
//         status: 'failed',
//       });
//     }
//   }

//   @Post('/join_room/:roomId')
//   @ApiBearerAuth()
//   @ApiOperation({
//     summary: "Record user is joining the room [room's objectId]",
//   })
//   async joinRoom(
//     @Param('roomId') roomId: string,
//     @Req() req: any,
//     @Res() res: any,
//   ) {
//     const isUpdated = await this.roomUserService.joinRoom(roomId, req.user.id);

//     if (isUpdated) {
//       res.status(HttpStatus.ACCEPTED).json({
//         status: 'success',
//       });
//     } else {
//       res.status(HttpStatus.BAD_REQUEST).json({
//         status: 'failed',
//       });
//     }
//   }

//   @Post('/uploadFile')
//   @ApiBearerAuth()
//   @ApiOperation({
//     summary: 'Record the file uploaded by user to firebase',
//   })
//   async uploadFile(
//     @Body() uploadFileDto: UploadFileDto,
//     @Req() req: any,
//     @Res() res: any,
//   ) {
//     if (req.user) {
//       const doc = await this.userService.findOneById(req.user?.id);

//       if (!doc) {
//         throw new NotFoundException(`No user is found`);
//       }

//       const isCreated = await this.userService.uploadFile(
//         req.user.id,
//         uploadFileDto,
//       );

//       if (isCreated) {
//         res.status(HttpStatus.ACCEPTED).json({
//           status: 'success',
//         });
//       } else {
//         res.status(HttpStatus.BAD_REQUEST).json({
//           status: 'failed',
//         });
//       }
//     }
//   }

//   @Get('/getUploadFiles')
//   @ApiBearerAuth()
//   @ApiOperation({
//     summary: 'Record the file uploaded by user to firebase',
//   })
//   async getUploadFiles(@Req() req: any, @Res() res: any) {
//     if (req.user) {
//       const doc = await this.userService.findOneById(req.user?.id);

//       if (!doc) {
//         throw new NotFoundException(`No user is found`);
//       }

//       const uploadFiles = await this.userService.getUploadFiles(req.user.id);

//       res.status(HttpStatus.ACCEPTED).json({
//         data: uploadFiles,
//         status: 'success',
//       });
//     }
//   }
}
