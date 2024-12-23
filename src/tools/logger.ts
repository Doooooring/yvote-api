import * as path from 'path';
import * as fs from 'fs';

export interface iReqLog {
  timestamp: string;
  method: string;
  url: string;
  headers: any;
  body: any;
}

export function reqLogger(logger: iReqLog) {
  const logFilePath = path.join(process.cwd(), 'request-logs.txt');
  const log = `[${logger.timestamp}][${logger.method}|${logger.url}]\n[header]${JSON.stringify(logger.headers)}\n[body]${JSON.stringify(logger.body)}`;

  fs.appendFileSync(logFilePath, log + '\n');
}
