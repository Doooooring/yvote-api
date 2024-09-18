export function clone<T>(obj: T) {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function bearerParse(token: string) {
  return token.trim().split(' ')[1];
}
