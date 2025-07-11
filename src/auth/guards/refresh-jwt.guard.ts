import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JwtService,  } from "@nestjs/jwt"
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();    
    const refreshToken = this.extractTokenFromHeader(request);
    if (!refreshToken) throw new UnauthorizedException();

    try {
      const payload = await this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      request['user'] = payload;
    } catch (e) {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request) { 
    const [type, token] = request.headers['authorization'].split(' ') ?? [];
    return type === 'Refresh' ? token : null;
  }
}
