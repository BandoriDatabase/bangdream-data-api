import Router from 'koa-router';
import { apiBase } from '../config';
import { dbJP, dbTW } from '../db';
import mapToList from '../utils/mapToList';

const api = 'degree';
const router = new Router();
const degreeList = {
  jp: mapToList(dbJP.degreeMap.entries),
  tw: mapToList(dbTW.degreeMap.entries),
};
const degreeMap = {
  jp: dbJP.degreeMap.entries,
  tw: dbTW.degreeMap.entries,
};

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  ctx.body = degreeList[ctx.params.server];
  await next();
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  try {
    ctx.body = degreeMap[ctx.params.server][ctx.params.id];
  } catch (error) {
    ctx.throw(400, 'degree not exists');
  } finally {
    await next();
  }
});

export default router;
