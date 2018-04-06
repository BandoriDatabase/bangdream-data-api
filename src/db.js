import { masDBAddr } from './config';

const dbMap = {};
Object.keys(masDBAddr).forEach((region) => {
  dbMap[region] = require(masDBAddr[region]);
});

export default dbMap;
