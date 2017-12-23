import Router from 'koa-router';
import { apiBase, pageLimit } from '../config';
import { dbJP, dbTW } from '../db';
import mapToList from '../utils/mapToList';

function addMaxParams(card) {
  const maxLv = Number(Object.keys(card.parameterMap).slice(-1)[0]);
  return Object.assign({}, card, {
    maxLevel: maxLv,
    maxPerformance: card.parameterMap[maxLv].performance,
    maxTechnique: card.parameterMap[maxLv].technique,
    maxVisual: card.parameterMap[maxLv].visual,
    totalMaxParam: Number(card.parameterMap[maxLv].performance) +
      Number(card.parameterMap[maxLv].technique) +
      Number(card.parameterMap[maxLv].visual),
  });
}

const api = 'card';
const router = new Router();
const cardList = {
  jp: mapToList(dbJP.cardInfos.entries).reverse().map(card => addMaxParams(card)),
  tw: mapToList(dbTW.cardInfos.entries).reverse().map(card => addMaxParams(card)),
};
const cardMap = {
  jp: dbJP.cardInfos.entries,
  tw: dbTW.cardInfos.entries,
};
const skillMap = {
  jp: dbJP.skillMap.entries,
  tw: dbTW.skillMap.entries,
};

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
    if (ctx.query.sort === 'asc') ctx.body = ctx.body.sort((a, b) => a[ctx.query.orderKey] - b[ctx.query.orderKey]);
    else if (ctx.query.sort === 'desc') ctx.body = ctx.body.sort((a, b) => b[ctx.query.orderKey] - a[ctx.query.orderKey]);
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

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  const card = cardMap[ctx.params.server][ctx.params.id];
  if (card) ctx.body = card;
  else ctx.throw(400, 'card not exists');
  await next();
});

export default router;
