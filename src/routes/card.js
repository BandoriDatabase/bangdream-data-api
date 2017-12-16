import Router from 'koa-router';
import { apiBase, pageLimit } from '../config';
import { dbJP, dbTW } from '../db';
import mapToList from '../utils/mapToList';

const api = 'card';
const router = new Router();
const cardList = {
  jp: mapToList(dbJP.cardInfos.entries).reverse(),
  tw: mapToList(dbTW.cardInfos.entries).reverse(),
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

function addMaxParams(card, isDelParamMap) {
  const maxLv = Number(Object.keys(card.parameterMap).slice(-1)[0]);
  return Object.assign({}, card, {
    maxLevel: maxLv,
    maxPerformance: card.parameterMap[maxLv].performance,
    maxTechnique: card.parameterMap[maxLv].technique,
    maxVisual: card.parameterMap[maxLv].visual,
    totalMaxParam: Number(card.parameterMap[maxLv].performance) +
      Number(card.parameterMap[maxLv].technique) +
      Number(card.parameterMap[maxLv].visual),
  }, {
    parameterMap: isDelParamMap ? undefined : card.parameterMap,
  });
}

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
  if (limit * (page - 1) > cardList[ctx.params.server].length || limit > pageLimit) {
    ctx.throw(400, 'query length exceed limit');
  }
  ctx.body = cardList[ctx.params.server].map(card => ({
    characterId: card.characterId,
    cardId: card.cardId,
    title: card.title,
    cardRes: card.cardRes,
    attr: card.attr,
    rarity: card.rarity,
    parameterMap: card.parameterMap,
    skill: skillMap[ctx.params.server][card.cardId],
  }));
  ctx.body = ctx.body.map(card => addMaxParams(card, true));
  if (ctx.query.rarity) {
    ctx.body = ctx.body
      .filter(card => ctx.query.rarity.includes(card.rarity));
  }
  if (ctx.query.attr) {
    ctx.body = ctx.body
      .filter(card => ctx.query.attr.includes(card.attr));
  }
  if (ctx.query.charaId) {
    ctx.body = ctx.body
      .filter(card => ctx.query.charaId.includes(card.characterId));
  }
  ctx.body = {
    totalCount: ctx.body.length,
    data: ctx.body.slice((page - 1) * limit, page * limit),
  };
  await next();
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  try {
    ctx.body = addMaxParams(cardMap[ctx.params.server][ctx.params.id]);
  } catch (error) {
    ctx.throw(400, 'card not exists');
  } finally {
    await next();
  }
});

export default router;