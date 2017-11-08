import Router from 'koa-router';
import { apiBase, masDBAddr, pageLimit } from '../config';
import mapToList from '../utils/mapToList';

const api = 'card';
const router = new Router();
const masterdb = require(masDBAddr);
const cardList = mapToList(masterdb.cardInfos.entries).reverse();

router.prefix(`${apiBase}/${api}`);

function addMaxParams(card, isDelParamMap) {
  const maxLv = Object.keys(card.parameterMap).slice(-1)[0];
  return Object.assign({}, card, {
    maxLevel: maxLv,
    maxPerformance: card.parameterMap[maxLv].performance,
    maxTechnique: card.parameterMap[maxLv].technique,
    maxVisual: card.parameterMap[maxLv].visual,
    totalMaxParam: String(Number(card.parameterMap[maxLv].performance) +
      Number(card.parameterMap[maxLv].technique) +
      Number(card.parameterMap[maxLv].visual)),
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
  if (limit * (page - 1) > cardList.length || limit > pageLimit) {
    ctx.throw(400, 'query length exceed limit');
  }
  ctx.body = cardList.map(card => ({
    characterId: card.characterId,
    cardId: card.cardId,
    title: card.title,
    cardRes: card.cardRes,
    attr: card.attr,
    rarity: card.rarity,
    parameterMap: card.parameterMap,
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
  ctx.body = addMaxParams(masterdb.cardInfos.entries[ctx.params.id]);
  await next();
});

export default router;
