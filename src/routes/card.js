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
  sum[region] = mapToList(dbMap[region].masterCharacterSituationMap.entries).reverse().map(addSimpleParams);
  return sum;
}, {});
const cardMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].masterCharacterSituationMap.entries;
  return sum;
}, {});
const skillMap = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].masterSituationSkillMap.entries;
  return sum;
}, {});
const skillList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = dbMap[region].masterSkillList.entries;
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
    skill: Object.assign({}, skillMap[ctx.params.server][card.situationSkillId], {
      skillDetail: skillList[ctx.params.server]
        .filter(skill => skill.skillId === skillMap[ctx.params.server][card.situationSkillId].skillId)[0],
    }),
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
  const totalCount = ctx.body.length;
  ctx.body = ctx.body.slice((page - 1) * limit, page * limit);
  if (!ctx.body.length) {
    ctx.throw(400, 'query length exceed limit');
    ctx.body = null;
  } else {
    ctx.body = {
      totalCount,
      data: ctx.body,
    };
  }
  await next();
});

router.get('/all', async (ctx, next) => {
  if (ctx.params.version === '1') {
    ctx.throw(410, 'API available from v2');
  } else {
    ctx.body = cardList[ctx.params.server].map(card => Object.assign({}, card, {
      skill: skillMap[ctx.params.server][card.situationSkillId],
    }));
  }
  await next();
});

router.get('/:id(\\d+)', async (ctx, next) => {
  const card = cardMap[ctx.params.server][ctx.params.id];
  switch (ctx.params.version) {
    case '1':
      if (card) ctx.body = addSimpleParams(card);
      else ctx.throw(400, 'card not exists');
      break;
    case '2':
      if (card) {
        ctx.body = addSimpleParams(Object.assign({}, card, {
          skill: skillMap[ctx.params.server][card.situationSkillId],
        }));
      } else ctx.throw(400, 'card not exists');
      break;
    default:
      ctx.throw(404);
  }
  await next();
});

router.post('/batch', async (ctx, next) => {
  const cardIds = ctx.request.body;
  switch (ctx.params.version) {
    case '1':
      ctx.body = cardIds.reduce((sum, curr) => {
        const card = cardMap[ctx.params.server][curr];
        if (card) sum[curr] = addSimpleParams(card);
        return sum;
      }, {});
      break;
    case '2':
      ctx.body = cardIds.reduce((sum, curr) => {
        const card = cardMap[ctx.params.server][curr];
        if (card) {
          sum[curr] = addSimpleParams(Object.assign({}, card, {
            skill: skillMap[ctx.params.server][card.situationSkillId],
          }));
        }
        return sum;
      }, {});
      break;
    default:
      ctx.throw(404);
  }
  await next();
});

export default router;
