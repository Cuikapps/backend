/*
https://docs.nestjs.com/guards#guards
*/

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
import { Socket } from 'socket.io';
import { CookieService } from 'src/feature/cookie/cookie.service';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly cookie: CookieService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient<Socket>();

    // Get the token value from the cookies
    const token =
      this.cookie.getCookie(client.handshake.headers.cookie ?? '', 'token') ??
      '';

    if (token) {
      return this.auth.verifyUserToken(token);
    } else {
      return false;
    }
  }
}
