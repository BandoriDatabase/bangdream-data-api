import Router from 'koa-router';
import lGet from 'lodash.get';
import { apiBase, pageLimit } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

function addSimpleParams(card) {
  const maxLv = Number(Object.keys(card.parameterMap).slice(-1)[0]);
  const minLv = 1;
  return Object.assign({}, card, {
    simpleParams: {
      min: {
        level: minLv,
        performance: card.parameterMap[minLv].performance,
        technique: card.parameterMap[minLv].technique,
        visual: card.parameterMap[minLv].visual,
        total: Number(card.parameterMap[minLv].performance) +
          Number(card.parameterMap[minLv].technique) +
          Number(card.parameterMap[minLv].visual),
      },
      max: {
        level: maxLv,
        performance: card.parameterMap[maxLv].performance,
        technique: card.parameterMap[maxLv].technique,
        visual: card.parameterMap[maxLv].visual,
        total: Number(card.parameterMap[maxLv].performance) +
          Number(card.parameterMap[maxLv].technique) +
          Number(card.parameterMap[maxLv].visual),
      },
    },
  });
}

const api = 'card';
const router = new Router();
const cardList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].cardInfos.entries).reverse().map(addSimpleParams);
  return sum;
}, {});
const cardMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].cardInfos.entries;
  return sum;
}, {});
const skillMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].skillMap.entries;
  return sum;
}, {});

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  // query accept 'rarity', 'attr', 'charaId', 'skill', 'limit', 'page', 'orderkey', 'sort'
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
  ctx.body = cardList[ctx.params.server].map(card => Object.assign({}, card, {
    skill: skillMap[ctx.params.server][card.cardId],
    parameterMap: undefined,
  }));
  if (ctx.query.rarity) {
    ctx.body = ctx.body
      .filter(card => ctx.query.rarity.includes(card.rarity.toString()));
  }
  if (ctx.query.attr) {
    ctx.body = ctx.body
      .filter(card => ctx.query.attr.includes(card.attr));
  }
  if (ctx.query.charaId) {
    ctx.body = ctx.body
      .filter(card => ctx.query.charaId.includes(card.characterId.toString()));
  }
  if (ctx.query.skill) {
    ctx.body = ctx.body
      .filter(card => ctx.query.skill.includes(card.skill.skillId.toString()));
  }
  if (ctx.query.sort && ctx.query.orderKey) {
    if (ctx.query.sort === 'asc') ctx.body = ctx.body.sort((a, b) => lGet(a, ctx.query.orderKey) - lGet(b, ctx.query.orderKey));
    else if (ctx.query.sort === 'desc') ctx.body = ctx.body.sort((a, b) => lGet(b, ctx.query.orderKey) - lGet(a, ctx.query.orderKey));
  }
  ctx.body = ctx.body.slice((page - 1) * limit, page * limit);
  if (!ctx.body.length) {
    ctx.throw(400, 'query length exceed limit');
    ctx.body = null;
  } else {
    ctx.body = {
      totalCount: ctx.body.length,
      data: ctx.body,
    };
  }
  await next();
});

router.get('/:id(\\d+)', async (ctx, next) => {
  const card = cardMap[ctx.params.server][ctx.params.id];
  if (card) ctx.body = addSimpleParams(card);
  else ctx.throw(400, 'card not exists');
  await next();
});

router.post('/batch', async (ctx, next) => {
  const cardIds = ctx.request.body;
  ctx.body = cardIds.reduce((sum, curr) => {
    const card = cardMap[ctx.params.server][curr];
    if (card) sum[curr] = addSimpleParams(card);
    return sum;
  }, {});
  await next();
});

export default router;
