import path from 'path';

export const port = process.env.PORT || 8180;
export const masDBAddr = path.join(__dirname, '../data/masterdb.json');
export const masterdb = require(masDBAddr);
export const apiBase = '/v1';
export const pageLimit = 9999;
