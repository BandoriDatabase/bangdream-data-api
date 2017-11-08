/**
 * Check environment on startup
 */

import fs from 'fs';
import fetch from 'isomorphic-fetch';
import { masDBAddr } from './config';

// make sure necessary env variables
if (!process.env.ALLOW_API_KEY) {
  console.log('No ALLOW_API_KEY provided, exiting');
  process.exit(2);
}

// download masterdb if it is not present, then force reload
if (!fs.existsSync(masDBAddr)) {
  console.log('no masterdb found, fetching one...');
  global.isFirstStart = true;
  fetch('https://res.bangdream.ga/static/MasterDB.json')
    .then(res => res.text())
    .then((res) => {
      fs.writeFileSync(masDBAddr, res);
      console.log('got a new masterdb, please restart server');
      process.exit(1);
    });
}
