import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PrivyClient,
  WalletWithMetadata,
  User as PrivyUser,
  LinkedAccountWithMetadata,
} from '@privy-io/server-auth';

import axios from 'axios';
import { SolanaService } from 'src/services/solana.service';

@Injectable()
export class PrivyService {
  private readonly logger = new Logger(PrivyService.name);

  private readonly appId: string;
  private readonly appSecret: string;
  private readonly client: PrivyClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly solanaService: SolanaService,
  ) {
    this.appId = this.configService.get<string>('PRIVY_APP_ID')!;
    this.appSecret = this.configService.get<string>('PRIVY_APP_SECRET')!;
    this.client = new PrivyClient(this.appId, this.appSecret);
  }

  async verifyAuthToken(authToken: string): Promise<any> {
    return await this.client.verifyAuthToken(authToken);
  }

  async getUser(privyUserId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://auth.privy.io/api/v1/users/${privyUserId}`,
        {
          auth: {
            username: this.appId,
            password: this.appSecret,
          },
          headers: {
            'privy-app-id': this.appId,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async checkUserByTwitterId(twitterId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://auth.privy.io/api/v1/users?twitterId=${twitterId}`,
        {
          auth: {
            username: this.appId,
            password: this.appSecret,
          },
          headers: {
            'privy-app-id': this.appId,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // async pregenerateUserByTwitter({
  //   twitterId,
  //   // username,
  //   // name,
  //   // avatar,
  // }: {
  //   twitterId: string;
  //   // username: string;
  //   // name: string;
  //   // avatar: string;
  // }): Promise<any> {
  //   const user = await this.client.importUser({
  //     linkedAccounts: [
  //       {
  //         type: 'twitter_oauth',
  //         subject: sub,
  //         username: null,
  //         name: null,
  //         profilePictureUrl: null,
  //       },
  //     ],
  //     createEthereumWallet: true,
  //     createSolanaWallet: true,
  //     createEthereumSmartWallet: true,
  //     customMetadata: {
  //       username: 'name',
  //       isVerified: true,
  //       age: 23,
  //     },
  //   });
  // }

  async pregenerateAdminPrivyUser(email: string): Promise<any> {
    const user = await this.client.importUser({
      linkedAccounts: [
        {
          type: 'email',
          address: email,
        },
      ],
      createEthereumWallet: false,
      createSolanaWallet: true,
      createEthereumSmartWallet: false,
      customMetadata: {
        username: 'martinpictta',
        isVerified: true,
        isAdmin: true,
        // age: 23,
      },
    });

    return user;
  }

  async getUserByTwitterId(twitterId: string): Promise<any> {
    return await this.client.getUserByTwitterSubject(twitterId);
  }

  async getUserByTwitterUsername(twitterUsername: string): Promise<any> {
    return await this.client.getUserByTwitterUsername(twitterUsername);
  }

  async getWalletByTwitterId(twitterId: string): Promise<any> {
    const user = await this.client.getUserByTwitterSubject(twitterId);
    if (!user) {
      throw new NotFoundException(
        `User with twitter ID: ${twitterId} is not found`,
      );
    }

    // Filter wallets of type 'wallet'
    const wallets = user.linkedAccounts.filter(
      (account: any) => account.type === 'wallet',
    );

    if (wallets.length === 0) {
      return null;
    }

    if (wallets.length === 1) {
      return wallets[0];
    }

    // If there are two wallets, return the one that is not privy embedded first
    const nonPrivyWallet = wallets.find(
      (account: any) =>
        !(
          account.walletClientType === 'privy' &&
          account.connectorType === 'embedded'
        ),
    );

    return nonPrivyWallet || wallets[0];
  }

  // async getWalletByTwitterId(twitterId: string): Promise<any> {
  //   const user = await this.client.getUserByTwitterSubject(twitterId);
  //   if (!user) {
  //     throw new NotFoundException(
  //       `User with twitter ID: ${twitterId} is not found`,
  //     );
  //   }

  //   const wallet = user.linkedAccounts.find(
  //     (account: any) =>
  //       account.walletClientType === 'privy' &&
  //       account.connectorType === 'embedded',
  //   );

  //   return wallet;
  // }

  // https://docs.privy.io/guide/server/wallets/new-user
  // pregenerate self-custodial solana embedded wallet while creating a new user with twitter ID
  async pregeneratePrivyUserByTwitter(data: {
    id: string;
    username: string;
    name: string;
    image: string;
  }): Promise<any> {
    const user = await this.client.importUser({
      linkedAccounts: [
        {
          type: 'twitter_oauth',
          subject: data.id,
          username: data.username,
          name: data.name,
          profilePictureUrl: data.image,
        },
      ],
      createEthereumWallet: false,
      createSolanaWallet: true,
      createEthereumSmartWallet: false,
      // customMetadata: {
      //   username: data.username,
      //   isVerified: true,
      //   isAdmin: true,
      //   // age: 23,
      // },
    });

    return user;
  }

  async checkPrivyEmbeddedWallet(user: PrivyUser): Promise<boolean> {
    // Check if the wallet to delegate by inspecting the user's linked accounts
    const hasPrivyWallet = user.linkedAccounts.find(
      (account: any) =>
        account.walletClientType === 'privy' &&
        account.connectorType === 'embedded',
    );

    return !!hasPrivyWallet;
  }

  // https://docs.privy.io/guide/server/wallets/existing-user
  // pregenerate self-custodial solana embedded wallet for existing user with twitter oauth that don't already have a solana wallet
  async addSolanaWalletToPrivyUser(privyUserId: string): Promise<any> {
    try {
      // await this.client.createWallets({
      //   userId: 'did:privy:cm71jexpr02d3o5f4xitzwm1z',
      // });

      const user = await this.client.createWallets({
        userId: privyUserId,
        createEthereumWallet: false,
        createSolanaWallet: true,
        createEthereumSmartWallet: false,
        // numberOfEthereumWalletsToCreate: 2,
      });

      return user;

      // const user = await this.client.getUser(
      //   'did:privy:cm71jexpr02d3o5f4xitzwm1z',
      // );

      // // Check if the wallet to delegate by inspecting the user's linked accounts
      // const isAlreadyDelegated = !!user?.linkedAccounts.find(
      //   (account): account is WalletWithMetadata =>
      //     account.type === 'wallet' &&
      //     account.delegated &&
      //     account.chainType === 'solana' &&
      //     account.connectorType === 'embedded',
      // );

      // const linkedAccount = user?.linkedAccounts.find(
      //   (account): account is WalletWithMetadata =>
      //     account.type === 'wallet' &&
      //     account.delegated &&
      //     account.chainType === 'solana' &&
      //     account.connectorType === 'embedded',
      // );

      // if (linkedAccount && linkedAccount.address) {
      //   return user;
      // }

      // const response = await this.client.addWalletToUser({
      //   did: user.did,
      //   chainType: 'solana',
      //   connectorType: 'embedded',
      //   // caip2: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
      // });

      // return response;
    } catch (error) {
      console.log(error);
      throw new NotFoundException('User not found');
    }
  }

  // create privy user account for creator
  async setPrivyUserForCreator(data: {
    id: string;
    username: string;
    name: string;
    image: string;
  }): Promise<any> {
    let privyUser: any;

    try {
      privyUser = await this.getUserByTwitterId(data?.id);
      if (!privyUser) {
        privyUser = await this.pregeneratePrivyUserByTwitter(data);
        this.logger.log(
          `Privy user ${privyUser.id} pregenerated for creator ${data?.username}`,
        );
      }

      const hasWallet = await this.checkPrivyEmbeddedWallet(privyUser);
      if (!hasWallet) {
        const user = await this.addSolanaWalletToPrivyUser(privyUser.id);
        this.logger.log(
          `Solana wallet added to privy user ${user.id} for creator ${data?.username}`,
        );
      }
    } catch (error) {
      this.logger.error(`setPrivyUserFromCreator error: ${error}`);
    }
  }

  // async addPrivyEmbeddedByPrivyUserId(privyUserId: string): Promise<any> {
  //   // const user = await this.client.getUser(privyUserId);
  //   const user = await this.client.createWallets({
  //     userId: privyUserId,
  //     createEthereumWallet: false,
  //     createSolanaWallet: true,
  //     createEthereumSmartWallet: false,
  //   });

  //   return user;
  // }

}
