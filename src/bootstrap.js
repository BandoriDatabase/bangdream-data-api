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
const toDL = [];
Object.keys(masDBAddr).forEach((region) => {
  if (!fs.existsSync(masDBAddr[region])) {
    global.isFirstStart = true;
    toDL.push(region);
    console.log(`no masterdb for ${region} found, fetching one...`);
    downloadDB(region).then(() => {
      const idx = toDL.indexOf(region);
      if (idx !== -1) {
        toDL.splice(idx, 1);
      }
      if (!toDL.length) {
        process.exit(1);
      }
    });
  }
});
