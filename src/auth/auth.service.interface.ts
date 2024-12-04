export abstract class AuthServiceInterface {
  abstract login(token: string): Promise<string>;

  tokenRefresh(token: string) {
    return token;
  }
}
