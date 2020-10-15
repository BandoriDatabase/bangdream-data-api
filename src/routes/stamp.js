import Router from 'koa-router';
import { apiBase, pageLimit } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

const api = 'stamp';
const router = new Router();
const stampList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].masterStampMap.entries);
  return sum;
}, {});
const stampMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].masterStampMap.entries;
  return sum;
}, {});

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  // query accept 'rarity', 'attr', 'charaId', 'limit', 'page'
  // console.log(ctx.query);
  const limit = ctx.query.limit || pageLimit;
  const page = ctx.query.page || 1;
  let sort;
  if (ctx.params.version === '2') {
    sort = ctx.query.sort || 'asc';
  }
  if (Array.isArray(limit) ||
    Array.isArray(page) ||
    !Number.isInteger(Number(limit)) ||
    !Number.isInteger(Number(page)) ||
    (ctx.params.version === '2' && (typeof sort !== 'string'))
  ) {
    ctx.throw(400, 'wrong query param type');
  }
  if (limit * (page - 1) > stampList[ctx.params.server].length || limit > pageLimit) {
    ctx.throw(400, 'query length exceed limit');
  }
  ctx.body = stampList[ctx.params.server];
  if (ctx.params.version === '2' && sort === 'desc') ctx.body = ctx.body.slice().reverse();
  ctx.body = {
    totalCount: ctx.body.length,
    data: ctx.body.slice((page - 1) * limit, page * limit),
  };
  await next();
});

router.get('/:id(\\d+)', async (ctx, next) => {
  try {
    ctx.body = stampMap[ctx.params.server][ctx.params.id];
  } catch (error) {
    ctx.throw(400, 'skill not exists');
  } finally {
    await next();
  }
});

export default router;
