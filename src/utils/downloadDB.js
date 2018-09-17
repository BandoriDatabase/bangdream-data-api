import fs from 'fs';
import fetch from 'isomorphic-fetch';
import { masDBAddr, remoteAddr } from '../config';

export default region => fetch(`${remoteAddr}/static/MasterDB_${region}.json`)
  .then(res => res.text())
  .then((res) => {
    fs.writeFileSync(masDBAddr[region], res);
    console.log(`got a new ${region} masterdb`);
  });
