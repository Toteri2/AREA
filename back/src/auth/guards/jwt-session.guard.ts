import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtSessionGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
      throw new UnauthorizedException('No token provided');

    const token = authHeader.substring(7);
    const decoded = await this.authService.verifyToken(token);

    if (!decoded) throw new UnauthorizedException('Invalid token');

    if (!request.session) {
      request.session = {};
    }
    request.session.userId = decoded.sub;
    return true;
  }
}
