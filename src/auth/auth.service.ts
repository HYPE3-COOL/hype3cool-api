import { Injectable, Logger } from '@nestjs/common';

import { UserService } from 'src/user/user.service';
import { DEFAULT_USER_PROFILE_PIC } from 'src/common/constants';
import { PrivyService } from 'src/modules/privy/privy.service';
import { pseudoRandomBytes } from 'crypto';
import { TwitterService } from 'src/services/twitter.service';
import { UserDocument } from 'src/user/entities/user.schema';
import { CreatorService } from 'src/creator/creator.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  TOKEN_PATH = 'activeTokens';

  constructor(
    private readonly userService: UserService,
    private readonly privyService: PrivyService,
    private readonly twitterService: TwitterService,
    private readonly creatorService: CreatorService,
  ) {}

  // sign up by privy and create user in mongodb
  async signUpByPrivy(privyUserId: string) {
    // get user data from privy
    const privyUser = await this.privyService.getUser(privyUserId);
    const linkedAccounts = privyUser['linked_accounts'];

    // check if the user has linked twitter account
    const twitterAccount = linkedAccounts.find(
      (account: any) => account.type === 'twitter_oauth',
    );

    // check if the user already exists in mongodb
    const userExist = await this.userService.findOne({ privyUserId });

    // if user does not exist, CREATE user in mongodb
    if (!userExist) {
      let username = this.generateUsernameFromSolana(linkedAccounts);

      // Check if the username already exists
      let isUsernameUnique = await this.userService.findOne({ username });

      // If the username already exists, append additional characters until a unique username is found
      if (isUsernameUnique) {
        let index = 6;
        while (isUsernameUnique) {
          username = this.generateUsernameFromSolana(linkedAccounts, index);
          isUsernameUnique = await this.userService.findOne({ username });
          index++;
        }
      }

      let newUser = await this.userService.create({
        privyUserId,
        username: username,
        displayName: privyUserId,
        image: this.getRandomImage(),
        isAdmin: false,
        isNewUser: twitterAccount ? false : true, // if user uses twitter to sign up privy, then it's not a new user, as not to trigger the dialog to ask user to link twitter account
        isCreator: false,
      });

      this.logger.log(`New user created: ${newUser.username}`);
      newUser.linkedAccounts = linkedAccounts;

      if (twitterAccount) {
        await this.fetchAndUpdateTwitterProfile(newUser, twitterAccount);
      }

      await newUser.save();

      // link user as creator
      if (twitterAccount) {
        await this.creatorService.linkByPrivyTwitterSignup(newUser);
      }

      return {
        user: {
          id: newUser.id,
          privyUserId: newUser.privyUserId,
          uid: newUser.uid,
          username: newUser.username,
          image: newUser.image,
        },
      };
    }

    this.logger.log(`Update current user: ${userExist.username}`);
    userExist.linkedAccounts = linkedAccounts;

    if (twitterAccount) {
      this.logger.log(`Update current user twitter: ${userExist.username}`);
      await this.fetchAndUpdateTwitterProfile(userExist, twitterAccount);
    } else {
      // if user does not have twitter account linked, then remove the twitter account from the user
      this.logger.log(
        `Remove twitter profile from user: ${userExist.username}`,
      );
      userExist.twitter = null;
    }

    await userExist.save();

    // link user as creator
    if (twitterAccount) {
      await this.creatorService.linkByPrivyTwitterSignup(userExist);
    } else {
      await this.creatorService.unlink(userExist.id);
    }

    return {
      user: {
        id: userExist.id,
        privyUserId: userExist.privyUserId,
        uid: userExist.uid,
        username: userExist.username,
        image: userExist.image,
      },
    };
  }

  private getRandomImage() {
    const index = Math.floor(Math.random() * DEFAULT_USER_PROFILE_PIC.length);
    return DEFAULT_USER_PROFILE_PIC[index];
  }

  private generateUsernameFromSolana(
    linkedAccounts: any[],
    length: number = 6,
  ): string {
    const solanaAccount = linkedAccounts.find(
      (account) => account.chain_type === 'solana',
    );
    if (solanaAccount && solanaAccount.address) {
      return solanaAccount.address.substring(0, length);
    }

    return pseudoRandomBytes(Math.ceil(length / 2))
      .toString('hex')
      .substring(0, length);
  }

  private async fetchAndUpdateTwitterProfile(
    doc: UserDocument,
    twitterDataFromPrivy: any,
  ) {
    this.logger.log(`Twitter account linked: ${twitterDataFromPrivy.username}`);

    const profile = await this.twitterService.getProfile(
      twitterDataFromPrivy.username,
    );

    if (profile) {
      const transformedProfile = this.twitterService.transform(profile);
      doc.twitter = {
        id: twitterDataFromPrivy.subject,
        username: twitterDataFromPrivy.username,
        name: twitterDataFromPrivy.name,
        image: twitterDataFromPrivy.profile_picture_url,
        ...transformedProfile,
      };
    } else {
      doc.twitter = {
        id: twitterDataFromPrivy.subject,
        username: twitterDataFromPrivy.username,
        name: twitterDataFromPrivy.name,
        image: twitterDataFromPrivy.profile_picture_url,
      };
    }
  }

  async verifyPrivyToken(token: string) {
    return await this.privyService.verifyAuthToken(token);
  }

  async validateByPrivyUserId(privyUserId: string) {
    return await this.userService.findOneByPrivyId(privyUserId);
  }

  async validateByUserToken(userId: string) {
    return await this.userService.findOneById(userId);
  }
}
