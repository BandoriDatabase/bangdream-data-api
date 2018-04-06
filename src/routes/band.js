import Router from 'koa-router';
import { apiBase } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

const api = 'band';
const router = new Router();
const bandList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].bandMap.entries);
  return sum;
}, {});
// const bandMap = {
//   jp: dbJP.bandMap.entries,
//   tw: dbTW.bandMap.entries,
// };

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  ctx.body = bandList[ctx.params.server];
  await next();
});

export default router;
