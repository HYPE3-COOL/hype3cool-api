import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrivyService } from 'src/modules/privy/privy.service';
import { AuthService } from '../auth.service';

@Injectable()
export class PrivyAuthGuard implements CanActivate {
  constructor(
    private readonly privyService: PrivyService,
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    try {
      const token = this.extractTokenFromHeader(request); // pass from sso portal

      if (!token) throw new UnauthorizedException('Token not found');

      // verify token
      const verifiedClaims = await this.privyService.verifyAuthToken(token);

      const user = await this.authService.validateByPrivyUserId(verifiedClaims?.userId);
      if (!user) {
        throw new UnauthorizedException();
      }
      request['user'] = user;
    } catch (e) {
      if (e.code == 'ERR_JWT_EXPIRED') {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException();
    }

    return true; // Allow access to the route
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers['authorization'].split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
