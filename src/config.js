import path from 'path';

export const port = process.env.PORT || 8180;
// support db for different server
export const masDBAddr = {
  jp: path.join(__dirname, '../data/masterdb_jp.json'),
  tw: path.join(__dirname, '../data/masterdb_tw.json'),
  kr: path.join(__dirname, '../data/masterdb_kr.json'),
  en: path.join(__dirname, '../data/masterdb_en.json'),
};
export const apiBase = '/v1/:server';
export const pageLimit = 9999;
