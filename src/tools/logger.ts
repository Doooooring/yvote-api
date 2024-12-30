import * as fs from 'fs';
import * as path from 'path';

export interface iReqLog {
  timestamp: string;
  method: string;
  url: string;
  headers: any;
  body: any;
}

export interface iErrLog {
  timestamp: string;
  message: string;
}

export function reqLogger(logger: iReqLog) {
  const logFilePath = path.join(process.cwd(), 'request-logs.txt');
  const log = `[${logger.timestamp}][${logger.method}|${logger.url}]\n[header]${JSON.stringify(logger.headers)}\n[body]${JSON.stringify(logger.body)}`;

  fs.appendFileSync(logFilePath, log + '\n');
}

export function errLoger(logger: iErrLog) {
  const logFilePath = path.join(process.cwd(), 'error-logs.txt');
  const log = `[${logger.timestamp}] ERROR LOG\n=========================================================\n\n ${logger.message} \n=========================================================\n\n `;
  fs.appendFileSync(logFilePath, log + '\n');
}

export function Logger(s: string) {
  const logFilePath = path.join(process.cwd(), 'logger.txt');
  fs.appendFileSync(logFilePath, s + '\n');
}
