import Router from 'koa-router';
import { apiBase } from '../config';
import { dbJP, dbTW } from '../db';
import mapToList from '../utils/mapToList';

const api = 'band';
const router = new Router();
const bandList = {
  jp: mapToList(dbJP.bandMap.entries),
  tw: mapToList(dbTW.bandMap.entries),
};
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
