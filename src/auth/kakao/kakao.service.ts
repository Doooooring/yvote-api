import { Injectable } from '@nestjs/common';
import { AuthServiceInterface } from '../auth.service.interface';

@Injectable()
export class KakakoAuthService extends AuthServiceInterface {
  async login(token: string) {
    console.log(token);
    return '';
  }
}
