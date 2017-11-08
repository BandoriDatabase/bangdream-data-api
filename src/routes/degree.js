import Router from 'koa-router';
import { apiBase, masterdb } from '../config';
import mapToList from '../utils/mapToList';

const api = 'degree';
const router = new Router();
const degreeList = mapToList(masterdb.degreeMap.entries);

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  ctx.body = degreeList;
  await next();
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  ctx.body = masterdb.degreeMap.entries[ctx.params.id];
  await next();
});

export default router;
