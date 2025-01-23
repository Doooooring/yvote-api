import { Injectable } from '@nestjs/common';
import { AuthServiceInterface } from '../auth.service.interface';
import axios from 'axios';

@Injectable()
export class KakakoAuthService extends AuthServiceInterface {
  constructor(
    private readonly KAKAO_API_URL = 'https://kapi.kakao.com',
    private readonly KAKAO_AUTH_URL = 'https://kauth.kakao.com',
  ) {
    super();
  }

  async login(token: string) {
    try {
      const response = await axios.get(`${this.KAKAO_API_URL}/v2/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });

      console.log('try kakao login repositories !!!!!!!');

      const { id, name, email } = response.data as {
        id: string;
        name: string;
        email: string;
      };

      if (!id) throw new Error();
    } catch (e) {
      //console.log(e);
      return e;
    }
  }
}
