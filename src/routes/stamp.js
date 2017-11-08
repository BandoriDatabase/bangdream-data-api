import Router from 'koa-router';
import { apiBase, masterdb, pageLimit } from '../config';
import mapToList from '../utils/mapToList';

const api = 'stamp';
const router = new Router();
const stampList = mapToList(masterdb.stampMap.entries).reverse();

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  // query accept 'rarity', 'attr', 'charaId', 'limit', 'page'
  // console.log(ctx.query);
  const limit = ctx.query.limit || pageLimit;
  const page = ctx.query.page || 1;
  if (Array.isArray(limit) ||
    Array.isArray(page) ||
    !Number.isInteger(Number(limit)) ||
    !Number.isInteger(Number(page))
  ) {
    ctx.throw(400, 'wrong query param type');
  }
  if (limit * (page - 1) > stampList.length || limit > pageLimit) {
    ctx.throw(400, 'query length exceed limit');
  }
  ctx.body = stampList;
  ctx.body = {
    totalCount: ctx.body.length,
    data: ctx.body.slice((page - 1) * limit, page * limit),
  };
  await next();
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  ctx.body = masterdb.stampMap.entries[ctx.params.id];
  await next();
});

export default router;
