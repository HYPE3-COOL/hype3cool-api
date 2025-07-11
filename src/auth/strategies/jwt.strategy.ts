import { AuthService } from '../auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export type JwtPayload = {
  id: string;
  username: string;
  sub: {  
    name: string;
  }
  // user: {
  //   id: string;
  //   username: string;
  //   sub: {
  //     name: string;
  //   }
  //   // displayName: string;
  //   // roles: string[];
  // };
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService, // Inject ConfigService
  ) {
    super({
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  // return the user object if the token is valid
  async validate(payload: JwtPayload) {
    const user = await this.authService.validateByUserToken(payload?.id);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
