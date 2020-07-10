import fs from 'fs';
import fetch from 'isomorphic-fetch';
import { masDBAddr, remoteAddr } from '../config';

export default async (region) => {
  try {
    const ver = await (await fetch(`${remoteAddr}/public/MAS_VER_${region}`)).text();
    const mdb = await (await fetch(`${remoteAddr}/database/master/${region}/MasterDB_${ver}.json`)).text();
    fs.writeFileSync(masDBAddr[region], mdb);
    console.log(`got a new ${region} masterdb`);
  } catch (error) {
    console.warn(`faield to fetch ${region} masterdb`);
  }
}
