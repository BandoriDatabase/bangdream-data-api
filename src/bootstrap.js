/**
 * Check environment on startup
 */

import fs from 'fs';
import { masDBAddr } from './config';
import downloadDB from './utils/downloadDB';

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// make sure necessary env variables
if (!process.env.ALLOW_API_KEY) {
  console.log('No ALLOW_API_KEY provided, exiting');
  process.exit(2);
}

// download masterdb if it is not present, then force reload
if (
  !fs.existsSync(masDBAddr.jp) ||
  !fs.existsSync(masDBAddr.tw) ||
  !fs.existsSync(masDBAddr.kr) ||
  !fs.existsSync(masDBAddr.en)
) {
  console.log('no masterdb found, fetching one...');
  global.isFirstStart = true;
  downloadDB();
}
