/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';

@Injectable()
export class CookieService {
  getCookie(cookies: string, cname: string): string | null {
    // Split cookie string and get all individual name=value pairs in an array
    const cookieArr = cookies.split(';');

    // Loop through the array elements
    for (const cookie of cookieArr) {
      const cookiePair = cookie.split('=');

      if (cookiePair[0].includes(' ')) {
        cookiePair[0] = cookiePair[0].replace(' ', '');
      }

      /* Removing whitespace at the beginning of the cookie name
        and compare it with the given string */
      if (cname === cookiePair[0]) {
        // Decode the cookie value and return
        return decodeURIComponent(cookiePair[1]);
      }
    }

    return null;
  }
}
