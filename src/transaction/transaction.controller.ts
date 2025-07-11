import {
  Controller,
} from '@nestjs/common';

import { TransactionService } from './transaction.service';
import {
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';


@Controller('transaction')
@ApiTags('Transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
    // private readonly coinService: CoinService,
  ) {}

  // @Post()
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Record the transaction' })
  // @ApiResponse({ status: 201, description: 'id of object' })
  // async create(
  //   @Body() createTransactionDto: CreateTransactionDto,
  //   @Req() req,
  //   @Res({ passthrough: true }) res,
  // ) {
  //   if (req?.user) {
  //     const creator = await this.userService.findOneById(req.user?.id);

  //     if (!creator) {
  //       throw new NotFoundException(`No creator is found`);
  //     }

  //     // check if coin exists
  //     const coin = await this.coinService.findOneById(
  //       createTransactionDto.coin,
  //     );
  //     if (!coin) {
  //       throw new NotFoundException(`Coin not found`);
  //     }

  //     const doc = await this.transactionService.create(
  //       creator,
  //       createTransactionDto,
  //     );
  //     if (!doc) res.status(HttpStatus.BAD_REQUEST);

  //     res.status(HttpStatus.CREATED).json({
  //       data: doc,
  //       status: 'success',
  //     });
  //   }

  //   throw new UnauthorizedException('User not found');
  // }

  // @Get('/:toAddress/presale')
  // @Public()
  // async aggregate(
  //   @Param('toAddress') toAddress: string,
  //   @Req() req,
  //   @Res({ passthrough: true }) res,
  // ) {
  //   const holders =
  //     await this.transactionService.getAggregatedAmounts(toAddress);

  //   res.status(HttpStatus.CREATED).json({
  //     data: holders,
  //     status: 'success',
  //   });
  // }

  // @Get('/:toAddress/checkPresalePaid')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'check if bought' })
  // @ApiResponse({ status: 200 })
  // async hasBought(
  //   @Param('toAddress') toAddress: string,
  //   @Req() req,
  //   @Res({ passthrough: true }) res,
  // ) {
  //   if (req?.user) {
  //     const creator = await this.userService.findOneById(req.user?.id);

  //     if (!creator) {
  //       throw new NotFoundException(`No creator is found`);
  //     }

  //     const paid = await this.transactionService.hasBought(
  //       creator,
  //       toAddress,
  //     );

  //     res.status(HttpStatus.CREATED).json({
  //       data: {
  //         paid,
  //       },
  //       status: 'success',
  //     });
  //   }

  //   throw new UnauthorizedException('User not found');
  // }
}
