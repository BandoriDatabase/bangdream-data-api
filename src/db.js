import { masDBAddr } from './config';
import downloadDB from './utils/downloadDB';

const dbMap = {};
Object.keys(masDBAddr).forEach((region) => {
  try {
    dbMap[region] = require(masDBAddr[region]);
  } catch (error) {
    console.warn(`masterdb ${region} corrupted, redownloading...`)
    downloadDB(region).then(() => process.exit(1));
  }
});

export default dbMap;
