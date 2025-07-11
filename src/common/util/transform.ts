import { Twitter } from "../interfaces";

export const transformToTwitter = (data: any): Twitter => {
    return { 
        id: data.userId,
        name: data.name,
        username: data.username,
        description: data.biography,
        biography: data.biography,
        image: data.avatar,
        avatar: data.avatar,
        banner: data.banner,
        verified: data.isBlueVerified,
        followersCount: data.followersCount,
        followingCount: data.followingCount,
        friendsCount: data.friendsCount,
        mediaCount: data.mediaCount,
        likesCount: data.likesCount,
        listedCount: data.listedCount,
        location: data.location,
        tweetsCount: data.tweetsCount,
        url: data.url,
        // isBlueVerified?: boolean;
        joined: data.joined,
    };
};
