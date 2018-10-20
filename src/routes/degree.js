import Router from 'koa-router';
import { apiBase } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

const api = 'degree';
const router = new Router();
const degreeList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].degreeMap.entries);
  return sum;
}, {});
const degreeMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].degreeMap.entries;
  return sum;
}, {});

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  ctx.body = degreeList[ctx.params.server];
  await next();
});

router.get('/:id(\\d+)', async (ctx, next) => {
  try {
    ctx.body = degreeMap[ctx.params.server][ctx.params.id];
  } catch (error) {
    ctx.throw(400, 'degree not exists');
  } finally {
    await next();
  }
});

export default router;
