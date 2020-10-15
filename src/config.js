import path from 'path';

export const port = process.env.PORT || 8180;
// support db for different server
export const masDBAddr = {
  jp: path.join(__dirname, '../data/masterdb_jp.json'),
  tw: path.join(__dirname, '../data/masterdb_tw.json'),
  // kr: path.join(__dirname, '../data/masterdb_kr.json'),
  en: path.join(__dirname, '../data/masterdb_en.json'),
  cn: path.join(__dirname, '../data/masterdb_cn.json'),
};
const remoteAddrMap = {
  development_local: 'http://localhost:8000',
  development: 'https://res.bandori.top/file',
  production: 'https://res.bandori.top/file',
};
export const remoteAddr = remoteAddrMap[process.env.NODE_ENV];
export const apiBase = '/v:version(1|2)/:server';
export const pageLimit = 9999;
