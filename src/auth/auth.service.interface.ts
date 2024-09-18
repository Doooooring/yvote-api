export abstract class AuthServiceInterface {
  abstract login(token: string): Promise<void>;

  tokenRefresh(token: string) {
    return token;
  }
}
