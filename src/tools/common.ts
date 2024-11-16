export function clone<T>(obj: T) {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function bearerParse(token: string) {
  return token.trim().split(' ')[1];
}

export function getRespSuccess(data: any) {
  return {
    success: true,
    data,
  };
}

export function getRespFail(data: any) {
  return {
    success: false,
    data,
  };
}

export function genDateId() {
  const id = new Date().getTime();
  return 'yvote-' + id;
}

export function convertImgToWebp() {}
