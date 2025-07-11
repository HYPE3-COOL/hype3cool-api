import {
  Injectable,
  BadRequestException,
  NotFoundException,
  RequestTimeoutException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ConfirmedSignatureInfo,
  Connection,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  PublicKey,
  SignaturesForAddressOptions,
  Transaction,
  TransactionConfirmationStatus,
  clusterApiUrl,
} from '@solana/web3.js';
import * as spl from '@solana/spl-token';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from '@solana/spl-token';
import { Metaplex } from '@metaplex-foundation/js';
import { Metadata, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import axios from 'axios';

@Injectable()
export class SolanaService implements OnModuleInit {
  private readonly rpcUrl: string;
  private readonly heliusRpcUrl: string;
  private connection: Connection;

  // private nftData: any;

  constructor(private readonly configService: ConfigService) {
    this.rpcUrl = this.configService.get<string>('SOLANA_RPC');
    this.heliusRpcUrl = this.configService.get<string>('HELIUS_RPC');
  }

  onModuleInit() {
    this.initConnection();
  }

  async initConnection() {
    // this.connection = new Connection(this.rpcUrl);
  }

  async validateWallet(wallet: string): Promise<boolean> {
    try {
      const owner = new PublicKey(wallet);
      return PublicKey.isOnCurve(owner.toBytes());
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // get default top 20 holders
  async getHolders(tokenAddress: string) {
    const mintAddress = new PublicKey(tokenAddress);
    const result = await this.connection.getTokenLargestAccounts(mintAddress);

    console.log({ result });
    // To convert all addresses to strings and return the modified array
    const holders = result.value.map((holder) => {
      return {
        ...holder,
        address: holder.address.toString(),
      };
    });

    return holders;
  }

  // async getNFTMetadata(tokenAddress: string): Promise<any> {
  //   try {
  //     // spl.TOKEN_PROGRAM_ID
  //     const connection = new Connection(
  //       this.rpcUrl || clusterApiUrl('mainnet-beta'),
  //     ); // Replace mainnet-beta with the desired network

  //     const account = await connection.getProgramAccounts(
  //       new PublicKey(spl.TOKEN_PROGRAM_ID),
  //       {
  //         dataSlice: {
  //           offset: 0, // number of bytes
  //           length: 0, // number of bytes
  //         },
  //         filters: [
  //           {
  //             dataSize: 165, // number of bytes
  //           },
  //           {
  //             memcmp: {
  //               offset: 0, // number of bytes
  //               bytes: new PublicKey(tokenAddress).toBase58(), // base58 encoded string
  //             },
  //           },
  //         ],
  //       }
  //     );
  //     // const tokenAccountInfo = await connection.getParsedAccountInfo(
  //     //   new PublicKey(tokenAddress),
  //     // );

  //     console.log({account})

  //   } catch (error) {
  //     throw new BadRequestException(error);
  //   }
  // }

  async getMetadataUri(tokenAddress): Promise<string | null> {
    // Connect to the Solana network (use 'mainnet-beta' for mainnet)
    // const connection = new Connection('https://api.devnet.solana.com');

    const connection = new Connection(
      this.rpcUrl || clusterApiUrl('mainnet-beta'),
    ); // Replace mainnet-beta with the desired network

    // Create a Metaplex instance
    const metaplex = new Metaplex(connection);

    // Convert the token address string to a PublicKey
    const mintPublicKey = new PublicKey(tokenAddress);

    try {
      // Fetch the NFT data
      const nft = await metaplex
        .nfts()
        .findByMint({ mintAddress: mintPublicKey });

      // Return the metadata URI
      return nft.uri;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  }

  async getNFTImage(tokenAddress: string): Promise<any> {
    try {
      const connection = new Connection(
        this.rpcUrl || clusterApiUrl('mainnet-beta'),
      ); // Replace mainnet-beta with the desired network

      // Fetch the token account info
      // <RpcResponseAndContext<AccountInfo<Buffer | ParsedAccountData> | null>>
      const tokenAccountInfo = await connection.getParsedAccountInfo(
        new PublicKey(tokenAddress),
      );
      if (!tokenAccountInfo) {
        return null;
      }
      const data = tokenAccountInfo.value.data as ParsedAccountData;

      const supplyString = data.parsed.info.supply;
      const decimals = data.parsed.info.decimals;
      const supplyInDecimal = parseFloat(supplyString) / Math.pow(10, decimals);
      return supplyInDecimal;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // // write function to get metadata uri from input token address
  // async getNFTMetadata(tokenAddress: string): Promise<any> {
  //   try {
  //     const connection = new Connection(
  //       this.rpcUrl || clusterApiUrl('mainnet-beta'),
  //     ); // Replace mainnet-beta with the desired network

  //     // Fetch the token account info
  //     const tokenAccountInfo = await connection.getParsedAccountInfo(
  //       new PublicKey(tokenAddress),
  //     );
  //    if (!tokenAccountInfo) {
  //      return null;
  //    }
  //     // Fetch the mint address
  //     const mintAddress = tokenAccountInfo.value.data.parsed.info.mint;
  //     // Fetch the metadata address
  //     const metadataAddress = await spl.Metadata.findProgramAddress(
  //       [
  //         Buffer.from('metadata'),
  //         spl.TOKEN_PROGRAM_ID.toBuffer(),
  //         new PublicKey(mintAddress).toBuffer(),
  //       ],
  //       spl.Metadata.programId,
  //     );

  //     // Fetch the metadata account info
  //     const metadataAccountInfo = await connection.getParsedAccountInfo(
  //       metadataAddress[0],
  //     );

  //     // Fetch the metadata uri
  //     const metadataUri = metadataAccountInfo.value.data.parsed.info.data.uri;

  //     return metadataUri;
  // } catch (error) {
  //   throw new BadRequestException(error);
  // }
  // }

  //   async getNFTs(walletAddress: string): Promise<any> {
  //     try {
  //       const wallet = new PublicKey(walletAddress);

  //       const connection = new Connection(
  //         this.rpcUrl || clusterApiUrl('mainnet-beta'),
  //       ); // Replace mainnet-beta with the desired network

  //       // Retrieve NFT holdings for the wallet
  //       const tokenAccountResults =
  //         await connection.getParsedTokenAccountsByOwner(wallet, {
  //           programId: spl.TOKEN_PROGRAM_ID,
  //         });

  //       // Filter the token accounts to get only the NFTs (tokens with amount = 1)
  //       const nftTokenAccounts = tokenAccountResults.value.filter(
  //         (account) =>
  //           account.account.data.parsed.info.tokenAmount.amount === '1',
  //       );

  //       // fetch all nft token addresses
  //       const mintAddresses = nftTokenAccounts.map(
  //         (account) => account.account.data.parsed.info.mint,
  //       );

  //       return mintAddresses;
  //     } catch (error) {
  //       throw new BadRequestException(error);
  //     }
  //   }

  async getTokenHolders(tokenAddress): Promise<any> {
    // Connect to the Solana network (use 'mainnet-beta' for mainnet)
    // const connection = new Connection('https://api.devnet.solana.com');

    const connection = new Connection(
      this.rpcUrl || clusterApiUrl('mainnet-beta'),
    ); // Replace mainnet-beta with the desired network

    // Create a Metaplex instance
    const metaplex = new Metaplex(connection);

    // Convert the token address string to a PublicKey
    const mintPublicKey = new PublicKey(tokenAddress);

    try {
      // // Fetch all token accounts for the given mint address
      const tokenAccounts =
        await connection.getTokenLargestAccounts(mintPublicKey);

      console.log({ tokenAccounts });

      // // // Extract holders and their balances
      // // const holders = tokenAccounts.value.map(accountInfo => {
      // //   const accountData = accountInfo.account.data.parsed.info;
      // //   return {
      // //     address: accountData.owner,
      // //     balance: accountData.tokenAmount.uiAmount
      // //   };
      // // });

      // // // Sort holders by balance in descending order
      // // holders.sort((a, b) => b.balance - a.balance);

      return tokenAccounts;
    } catch (error) {
      console.error('Error fetching token holders:', error);
      return null;
    }
  }

  // Function to fetch bonding curve data
  // async fetchBondingCurveData(bondingCurveAddress) {
  //   try {
  //     const publicKey = new PublicKey(bondingCurveAddress);
  //     const accountInfo = await connection.getAccountInfo(publicKey);

  //     if (!accountInfo) {
  //       throw new Error('No account data available');
  //     }

  //     const accountData = accountInfo.data;

  //     // Define the layout of the bonding curve data
  //     const bondingCurveLayout = struct.struct([
  //       struct.u64('virtualSolReserves'),
  //       struct.u64('virtualTokenReserves'),
  //     ]);

  //     // Deserialize the account data
  //     const { virtualSolReserves, virtualTokenReserves } =
  //       bondingCurveLayout.decode(accountData);

  //     console.log('Virtual SOL Reserves:', virtualSolReserves.toString());
  //     console.log('Virtual Token Reserves:', virtualTokenReserves.toString());

  //     // Calculate the token price in SOL
  //     const tokenPriceSol = virtualSolReserves / virtualTokenReserves;
  //     console.log('Token Price in SOL:', tokenPriceSol);

  //     // Fetch the current SOL price in USD (you can use an API like CoinGecko)
  //     const solPriceUsd = await fetchCurrentSolPriceInUsd();
  //     const tokenPriceUsd = tokenPriceSol * solPriceUsd;

  //     console.log('Token Price in USD:', tokenPriceUsd);

  //     return {
  //       virtualSolReserves,
  //       virtualTokenReserves,
  //       tokenPriceSol,
  //       tokenPriceUsd,
  //     };
  //   } catch (error) {
  //     console.error('Error fetching bonding curve data:', error);
  //     return null;
  //   }
  // }

  // async function getBondingCurveAddress(tokenAddress) {
  //   // Find the token metadata account
  //   const [metadataAddress] = await PublicKey.findProgramAddress(
  //     [
  //       Buffer.from('metadata'),
  //       new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
  //       new PublicKey(tokenAddress).toBuffer(),
  //     ],
  //     new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
  //   );

  //   // Fetch the metadata account data
  //   const metadataAccountInfo = await connection.getAccountInfo(metadataAddress);
  //   if (!metadataAccountInfo) {
  //     throw new Error('Metadata account not found');
  //   }

  //   // Deserialize the metadata
  //   const metadata = Metadata.deserialize(metadataAccountInfo.data)[0];

  //   // The bonding curve address should be in the metadata's data field
  //   const bondingCurveAddress = metadata.data.creators[0].address;

  //   return bondingCurveAddress;
  // }

  async getBondingCurveAddress(tokenAddress: string) {
    const connection = new Connection(
      this.rpcUrl || clusterApiUrl('mainnet-beta'),
    );

    const PROGRAM_ID = new PublicKey(
      'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
    );

    // console.log({ programId: spl.TOKEN_PROGRAM_ID.toString() })    // TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
    // console.log({ programId: PROGRAM_ID.toString() })             // metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
    // console.log({ ASSOCIATED_TOKEN_PROGRAM_ID: spl.ASSOCIATED_TOKEN_PROGRAM_ID.toString() }) // ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL
    // console.log({TOKEN_2022_PROGRAM_ID: spl.TOKEN_2022_PROGRAM_ID.toString()}) // Token1n7vJvY3oqf2b4vUj1kxQfLuK2zXuJ1vZ1n3b6z

    // q: Find the token metadata account

    const [metadataAddress] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        PROGRAM_ID.toBuffer(),
        new PublicKey(tokenAddress).toBuffer(),
      ],
      PROGRAM_ID,
    );

    // const [metadataAddress] = await PublicKey.findProgramAddress(
    //   [
    //     Buffer.from('metadata'),
    //     PROGRAM_ID.toBuffer(),
    //     // spl.TOKEN_PROGRAM_ID.toBuffer(),
    //     // Metadata.PROGRAM_ID.toBuffer()
    //     new PublicKey(tokenAddress).toBuffer(),
    //   ],
    //   // spl.TOKEN_PROGRAM_ID,
    //   PROGRAM_ID,

    // );

    // Fetch the metadata account data
    const metadataAccountInfo =
      await connection.getAccountInfo(metadataAddress);
    if (!metadataAccountInfo) {
      throw new Error('Metadata account not found');
    }

    // deserialize metadata account info

    // // // Deserialize the metadata
    console.log({ metadataAccountInfo });

    // // console.log(metadataAccountInfo.data[0].toString());
    // // return metadataAccountInfo;

    // const { data: bufferData, ...rest } = metadataAccountInfo;

    // // Assuming UTF-8 encoding for the Buffer data
    // const stringData = bufferData.toString('utf8');

    // console.log({ stringData });

    // // Parse the string data as JSON (if applicable)
    // let parsedData;
    // try {
    //   parsedData = JSON.parse(stringData);
    // } catch (error) {
    //   // If parsing fails, treat stringData as plain text
    //   parsedData = stringData;
    // }

    // // Replace the Buffer with the parsed data
    // return {
    //   metadataAccountInfo: {
    //     ...rest,
    //     data: parsedData,
    //   },
    // };

    // const metadata = Metadata.deserialize(metadataAccountInfo.data)[0];

    // // The bonding curve address should be in the metadata's data field
    // const bondingCurveAddress = metadata.data.creators[0].address;

    // return bondingCurveAddress;
  }

  // async getTokenMetadata(tokenAddress: string) {
  //   const connection = new Connection('https://api.mainnet-beta.solana.com');
  //   const metaplex = Metaplex.make(connection);

  //   const mintAddress = new PublicKey(tokenAddress);

  //   let tokenName;
  //   let tokenSymbol;
  //   let tokenLogo;
  //   let tokenCreators;
  //   let tokenWebsite;
  //   let tokenSupply;
  //   let tokenCurrency;
  //   let json;
  //   let mint;
  //   let tokenJson;

  //   const metadataAccount = metaplex
  //     .nfts()
  //     .pdas()
  //     .metadata({ mint: mintAddress });

  //   const metadataAccountInfo =
  //     await connection.getAccountInfo(metadataAccount);

  //   if (metadataAccountInfo) {
  //     const token: any = await metaplex
  //       .nfts()
  //       .findByMint({ mintAddress: mintAddress });

  //     console.log({ token });
  //     tokenName = token.name;
  //     tokenSymbol = token.symbol;
  //     tokenLogo = token.json.image; // profile picture
  //     tokenCreators = token.creators;
  //     tokenWebsite = token.json.website;
  //     tokenSupply = token.mint.supply;
  //     tokenCurrency = token.mint.currency;
  //     json = token.json;
  //     mint = token.mint;

  //     tokenJson = token;
  //   }

  //   return {
  //     // name: tokenName,
  //     // symbol: tokenSymbol,
  //     // logo: tokenLogo,
  //     // creators: tokenCreators,
  //     // supply: tokenSupply,
  //     // currency: tokenCurrency,
  //     // json,
  //     // mint,
  //     ...tokenJson,

  //   };
  // }

  // async getTokenMetadata(tokenAddress: string) {
  //   // try {
  //   let tokenJson;
  //   // const connection = new Connection('https://api.mainnet-beta.solana.com');

  //   const connection = new Connection(
  //     this.rpcUrl || clusterApiUrl('mainnet-beta'),
  //   ); // Replace mainnet-beta with the desired network
  //   const metaplex = Metaplex.make(connection);
  //   const mintAddress = new PublicKey(tokenAddress);

  //   const metadataAccount = metaplex
  //     .nfts()
  //     .pdas()
  //     .metadata({ mint: mintAddress });

  //   const metadataAccountInfo =
  //     await connection.getAccountInfo(metadataAccount);

  //   if (!metadataAccountInfo)
  //     throw new NotFoundException('Metadata account not found');

  //   if (metadataAccountInfo) {
  //     // q: how to set timeout for this function below
  //     // a: use Promise
  //     // const token: any = await metaplex
  //     //   .nfts()
  //     //   .findByMint({ mintAddress: mintAddress });

  //     const token: any = await Promise.race([
  //       metaplex.nfts().findByMint({ mintAddress: mintAddress }),
  //       new Promise((resolve, reject) => {
  //         setTimeout(() => {
  //           reject(new RequestTimeoutException());
  //         }, 20000);
  //       }),
  //     ]);

  //     tokenJson = token;
  //   }

  //   // console.log({ mintAddress, metadataAccount, metadataAccountInfo });

  //   const [metadataAddress] = await PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from('metadata'),
  //       PROGRAM_ID.toBuffer(),
  //       new PublicKey(tokenAddress).toBuffer(),
  //     ],
  //     PROGRAM_ID,
  //   );

  //   // Fetch the metadata account data
  //   const accountInfo = await connection.getAccountInfo(metadataAddress);

  //   // if (accountInfo) {
  //   //   // console.log({ accountInfo });
  //   //   // const metadata = Metadata.deserialize(accountInfo.data)[0];
  //   //   // let metadataJson = metadata.data;
  //   //   // console.log({ metadata: metadataJson, name: metadata.data.name });
  //   // }

  //   return {
  //     ...tokenJson,
  //     key: Metadata.deserialize(accountInfo?.data)[0].key,
  //   };
  //   // } catch (error) {
  //   //   throw new BadRequestException(error);
  //   //   // throw error;
  //   // }
  // }

  async getSignatures(address: string, limit: number = 100) {
    const pubKey = new PublicKey(address);
    const signatures = await this.connection.getSignaturesForAddress(pubKey, {
      limit,
    });
    return signatures.map((sig) => sig.signature);
  }

  // async getProgramAccountsExample(address: string) {
  //   let gPAExampleRequest = {
  //     "method": "alchemy_getProgramAccounts",
  //     "params": [
  //       `"${address}"`,
  //       {
  //         "encoding": "base64",
  //         "withContext": true,
  //         "order": "desc"
  //       }
  //     ],
  //     "id": 0,
  //     "jsonrpc": "2.0"
  //   }
  //   let programAccounts = []

  //   const alchemyRPCUrl = "https://solana-mainnet.g.alchemy.com/v2/<YOUR-API-KEY>"
  //   try {
  //     let response = await axios.post(this.rpcUrl, gPAExampleRequest);
  //     let responseData = response.data["result"]

  //     // continue aggregating if there's a new pageKey present in the latest response
  //     while (responseData["pageKey"]) {
  //       programAccounts = programAccounts.concat(responseData["value"]);

  //       // place the pagekey within the optional config object
  //       // (you may need to create that config object if you didn't have it originally)
  //       gPAExampleRequest["params"][1]["pageKey"] = responseData["pageKey"];

  //       // make another call to getProgramAccounts with the pageKey
  //       response = await axios.post(this.rpcUrl, gPAExampleRequest);
  //       responseData = response.data["result"]
  //     }

  //      programAccounts = programAccounts.concat(responseData["value"]);
  //      return programAccounts;
  //    } catch (err) {
  //      console.error(`Error in Response, Data is: ${err.data}`);
  //      return [];
  //    }
  // }

  async getSuccessfulTransactions(address: string, limit: number = 10) {
    // const connection = new Connection('https://api.devnet.solana.com'); // Replace with your Solana network

    const signatures = await this.getSignatures(address);

    // return signatures;

    const transactionDetails = await Promise.all(
      signatures.map(async (signature) => {
        const transaction = await this.connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });
        // const transaction = await this.connection.getParsedTransaction(signature, {
        //   maxSupportedTransactionVersion: 0,

        // });
        return transaction;
      }),
    );

    // const transactionDetails = await Promise.all(
    //   signatures.map(async (signature) => {
    //     const transaction = await this.connection.getTransaction(signature);
    //     return transaction;
    //   })
    // );

    return transactionDetails;
  }
  //   // 1. Get Signatures
  //   const _address = new PublicKey(address);
  //   const signatures = await this.connection.getSignaturesForAddress(_address, {
  //     limit,
  //   });

  //   // // 2. Fetch and Filter Transactions
  //   const successfulTransactions = [];
  //   for (const t of signatures) {
  //     const transaction = await this.connection.getParsedTransaction(
  //       t.signature,
  //       {
  //         maxSupportedTransactionVersion: 0,
  //         jsonParsed: true,
  //        },
  //     );

  //     if (!transaction.meta.err) {
  //       // console.log({ transaction });

  //       // q: how to get transaction details, does it need to parse the transaction data?
  //       // a: use getTransactionDetails
  //       // const transactionDetails = await this.connection.getTransaction(t.signature);
  //       // console.log({ transactionDetails });

  //       successfulTransactions.push(transaction);
  //     }
  //     //   const transaction = await this.connection.getTransaction(t.signature);
  //     //   // console.log(!transaction.meta.err)
  //     //   if (!transaction.meta.err) {
  //     //     successfulTransactions.push(transaction);
  //     //   }
  //     // }
  //   }
  //   // return successfulTransactions;
  //   return successfulTransactions;
  // }

  // get the first mint transaction of a token in solana
  // async getFirstMintTransaction(tokenAddress: string) {
  //   const mintAddress = new PublicKey(tokenAddress);
  //   const mintTransactions = await this.connection.getParsedConfirmedTransactions(
  //     mintAddress,
  //     {
  //       limit: 1,
  //     },
  //   );

  //   return mintTransactions;
  // }

  // async getAllSignatures(address: string, limit: number = 10) {
  //   const pubKey = new PublicKey(address);
  //   const signatures = await this.connection.getSignaturesForAddress(pubKey, { limit});
  //   return signatures.map(sig => sig.signature);
  // }

  async getAllSignatures(
    address: string,
    lastSignature?: string,
  ): Promise<ConfirmedSignatureInfo[]> {
    // let allSignatures: string[] = [];
    let allSignatures: ConfirmedSignatureInfo[] = [];
    // let lastSignature: string | undefined;

    const pubKey = new PublicKey(address);

    while (true) {
      const options: SignaturesForAddressOptions = {
        // limit: 1000,
        limit: 100,
        until: lastSignature,
        // before: lastSignature,
      };

      const signatures = await this.connection.getSignaturesForAddress(
        pubKey,
        options,
      );

      if (signatures.length === 0) {
        break; // No more signatures to fetch
      }

      const filteredSignatures = signatures.filter((signature) => {
        // Filter out signatures with non-empty 'err' and 'confirmationStatus' is not 'processed'
        return (
          signature.err === null && signature.confirmationStatus !== 'processed'
        );
      });

      allSignatures = allSignatures.concat(filteredSignatures);

      break;
      // if (signatures.length < 1000) {
      //   break; // Last batch, no need to continue
      // }

      lastSignature = signatures[signatures.length - 1].signature;
    }

    // reverse the array to get the oldest transactions first
    // allSignatures.reverse();

    return allSignatures;
  }

  async getTransaction(signature: string): Promise<any> {
    const transaction = await this.connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    return transaction;

    // const transactions = await Promise.all(
    //   signatures.map(async signature => {
    //     return this.connection.getSignatureStatus(signature);
    //   })
    // );

    // return transactions;
  }

  // find the associated token address of a token
  async getAssociatedTokenAddress(tokenAddress: string) {
    // , walletAddress?: string

    // spl.ASSOCIATED_TOKEN_PROGRAM_ID

    // const associatedToken
    //   = await spl.AssociatedTokenAccount.getAssociatedTokenAddress(
    //     spl.ASSOCIATED_TOKEN_PROGRAM_ID,
    //     spl.TOKEN_PROGRAM_ID,
    //     new PublicKey(tokenAddress),
    //     new PublicKey(walletAddress),
    //   );

    // return associatedToken;

    const pubKey = new PublicKey(tokenAddress);
    // const walletPubKey = new PublicKey(walletAddress);

    const result = PublicKey.findProgramAddressSync(
      [
        // walletPubKey.toBuffer(),
        spl.TOKEN_PROGRAM_ID.toBuffer(),
        pubKey.toBuffer(),
      ],
      spl.ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    console.log({ result });

    return result[0];
  }

  async transferToken(
    // connection: Connection,
    payerWallet: string,
    receiverAddress: string,
    tokenMintAddress: string,
    amount: number,
  ): Promise<any> {
    if (!payerWallet) {
      throw new Error('Payer wallet is not available');
    }

    try {
      console.log('Starting getTransferTokenTransaction');
      console.log('payerWallet:', payerWallet);
      console.log('receiverAddress:', receiverAddress);
      console.log('tokenMintAddress:', tokenMintAddress);
      console.log('amount:', amount);

      const senderWalletAddress = new PublicKey(payerWallet);
      console.log('senderWalletAddress:', senderWalletAddress.toString());
      const receiverWalletAddress = new PublicKey(receiverAddress);
      console.log('receiverWalletAddress:', receiverWalletAddress.toString());

      const tokenMint = new PublicKey(tokenMintAddress);
      console.log('tokenMint:', tokenMint.toString());

      const senderAssociatedTokenAddress = await getAssociatedTokenAddress(
        tokenMint,
        senderWalletAddress,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );
      console.log(
        'senderAssociatedTokenAddress:',
        senderAssociatedTokenAddress.toString(),
      );

      const receiverAssociatedTokenAddress = await getAssociatedTokenAddress(
        tokenMint,
        receiverWalletAddress,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );
      console.log(
        'receiverAssociatedTokenAddress:',
        receiverAssociatedTokenAddress.toString(),
      );

      // console.log(`Sender Associated Token Account Address: ${senderAssociatedTokenAddress.toBase58()}`);
      // console.log(`Receiver Associated Token Account Address: ${receiverAssociatedTokenAddress.toBase58()}`);

      const transaction = new Transaction();

      // Check if the sender's associated token account exists
      const senderAccountInfo = await this.connection.getAccountInfo(
        senderAssociatedTokenAddress,
      );
      console.log('senderAccountInfo:', senderAccountInfo);
      if (!senderAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            senderWalletAddress,
            senderAssociatedTokenAddress,
            senderWalletAddress,
            tokenMint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          ),
        );
      }

      // Check if the receiver's associated token account exists
      const receiverAccountInfo = await this.connection.getAccountInfo(
        receiverAssociatedTokenAddress,
      );
      console.log('receiverAccountInfo:', receiverAccountInfo);
      if (!receiverAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            senderWalletAddress,
            receiverAssociatedTokenAddress,
            receiverWalletAddress,
            tokenMint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          ),
        );
      }

      transaction.add(
        createTransferInstruction(
          senderAssociatedTokenAddress,
          receiverAssociatedTokenAddress,
          senderWalletAddress,
          amount,
          [],
          TOKEN_PROGRAM_ID,
        ),
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      console.log('blockhash:', blockhash);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderWalletAddress;
      console.log('transaction:', transaction);

      return {
        transaction,
        senderAssociatedTokenAddress: senderAssociatedTokenAddress.toString(),
        receiverAssociatedTokenAddress:
          receiverAssociatedTokenAddress.toString(),
      };
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  }

  async getTokenMetadata(tokenAddress: string) {
    try {
      const response = await fetch(this.heliusRpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'text',
          method: 'getAsset',
          params: { id: tokenAddress },
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('Error in getting token metadata:', error);
      return {
        name: '',
        symbol: '',
        token_info: {},
      };
    }
  }

  async getTransactionDetails(signature: string): Promise<any> {
    try {
      const response = await fetch(this.heliusRpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          // params: { id: tokenAddress },
          params: [signature, 'json'],
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('Error in getting', error);
      return undefined;
      // return {
      //   name: '',
      //   symbol: '',
      //   token_info: {},
      // };
    }
  }

  async getSignatureStatuses(signatures: string[]): Promise<any> {
    try {
      const response = await fetch(this.heliusRpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignatureStatuses',
          params: [
            signatures,
            {
              searchTransactionHistory: true,
            },
          ],
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('Error in getting', error);
      return undefined;
      // return {
      //   name: '',
      //   symbol: '',
      //   token_info: {},
      // };
    }
  }
}

// function findAssociatedTokenAddress(
//     walletAddress: PublicKey,
//     tokenMintAddress: PublicKey
// ): PublicKey {
//     return PublicKey.findProgramAddressSync(
//         [
//             walletAddress.toBuffer(),
//             TOKEN_PROGRAM_ID.toBuffer(),
//             tokenMintAddress.toBuffer(),
//         ],
//         spl.ASSOCIATED_TOKEN_PROGRAM_ID
//     )[0];
// }
