import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionService } from './transaction.service'; // Service for MongoDB operations
import { SolanaService } from 'src/services/solana.service';

@WebSocketGateway({
  namespace: 'transaction',
  cors: {
    origin: 'http://localhost:3000', // Allow requests from this origin
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class TransactionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly solanaService: SolanaService,
    private readonly transactionService: TransactionService,
  ) {}

  async afterInit(server: Server) {
    // server.use(
    //   AuthWsMiddleware(this.jwtService, this.configService, this.authService),
    // );
  }

  handleConnection(client: Socket) {
    console.log('transaction gateway client connected:', client.id);
    // Optionally, you can send the current balance and transaction logs on connection
    // this.sendCurrentData(client);
  }

  handleDisconnect(client: Socket) {
    console.log('transaction gateway client disconnected:', client.id);
  }

  // Emit event for new transaction logs
  emitTransactionUpdate(address: string, holders: any[]) {
    this.server.emit('transactionUpdate', { address, holders });
  }

  // private async sendCurrentData(client: Socket) {
  //     const balance = await this.solanaService.getBalance();
  //     const transactions = await this.transactionService.getRecentTransactions();
  //     client.emit('balanceUpdate', balance);
  //     client.emit('transactionLogUpdate', transactions);
  // }

  // @Cron(CronExpression.EVERY_MINUTE) // Adjust as necessary
  // async monitorTransactions() {
  //     const newTransactions = await this.solanaService.checkForNewTransactions();

  //     if (newTransactions.length > 0) {
  //         // Save new transactions to MongoDB
  //         await this.transactionService.saveTransactions(newTransactions);

  //         // Emit updates to all connected clients
  //         this.server.emit('transactionLogUpdate', newTransactions);
  //         const updatedBalance = await this.solanaService.getBalance();
  //         this.server.emit('balanceUpdate', updatedBalance);
  //     }
  // }
}

// import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

// @WebSocketGateway()
// export class TransactionGateway {
//   @SubscribeMessage('message')
//   handleMessage(client: any, payload: any): string {
//     return 'Hello world!';
//   }
// }
