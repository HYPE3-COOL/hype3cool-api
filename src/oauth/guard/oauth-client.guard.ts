import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { OauthClientService } from '../services/oauth-client.service';
import { parseBase64Credentials } from 'src/common/util/crypto-util';

@Injectable()
export class OAuthClientGuard implements CanActivate {
  private readonly logger = new Logger(OAuthClientGuard.name);

  constructor(private readonly oauthClientService: OauthClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('OAuthClientGuard canActivate called');

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException(
        'Authorization header missing or invalid',
      );
    }

    const base64Credentials = authHeader.split(' ')[1];
    const [clientId, clientSecret] = parseBase64Credentials(base64Credentials);

    // Validate client credentials
    const isValid = await this.oauthClientService.validateClient(
      clientId,
      clientSecret,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    return true;
  }
}
