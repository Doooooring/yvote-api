export function clone<T>(obj: T) {
  return JSON.parse(JSON.stringify(obj)) as T;
}
export function mergeUniqueArrays<T>(array1: Array<T>, array2: Array<T>) {
  const mergedArray = [...new Set([...array1, ...array2])];
  return mergedArray;
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
  return id;
}

export function getKRTime(t: string) {
  const utc = new Date(t);
  utc.setHours(utc.getHours() + 18);
  return utc;
}

export function convertImgToWebp() {}
