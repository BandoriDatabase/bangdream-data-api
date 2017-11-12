import Router from 'koa-router';
import { apiBase } from '../config';
import { dbJP, dbTW } from '../db';
import mapToList from '../utils/mapToList';

const api = 'skill';
const router = new Router();
const skillMapList = {
  jp: mapToList(dbJP.skillMap.entries),
  tw: mapToList(dbTW.skillMap.entries),
};
const skillList = {
  jp: dbJP.skillList.entries,
  tw: dbTW.skillList.entries,
};
const skillActivateEffectList = {
  jp: dbJP.skillActivateEffectList.entries,
  // tw: dbTW.skillActivateEffectList.entries,
};
const skillOnceEffectList = {
  jp: dbJP.skillOnceEffectList.entries,
  // tw: dbTW.skillOnceEffectList.entries,
};

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  ctx.body = skillList[ctx.params.server].reduce((prev, curr) => {
    if (prev.find(elem2 => elem2.skillId === curr.skillId)) return prev;
    prev.push(curr);
    return prev;
  }, []);
  await next();
});

router.get('/cardId/:cardId(\\d{1,4})', async (ctx, next) => {
  try {
    ctx.body = skillMapList[ctx.params.server].find(skill => skill.cardId === Number(ctx.params.cardId));
    ctx.body.skillDetail = skillList[ctx.params.server]
      .filter(skill => skill.skillId === ctx.body.skillId);
    if (skillActivateEffectList[ctx.params.server]) {
      ctx.body.activateEffect = skillActivateEffectList[ctx.params.server]
        .filter(se => se.skillId === ctx.body.skillId);
    }
    if (skillOnceEffectList[ctx.params.server]) {
      ctx.body.onceEffect = skillOnceEffectList[ctx.params.server]
        .filter(se => se.skillId === ctx.body.skillId);
    }
  } catch (error) {
    ctx.throw(400, 'skill not exists');
  } finally {
    await next();
  }
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  try {
    ctx.body = skillMapList[ctx.params.server]
      .filter(skill => skill.skillId === Number(ctx.params.id))
      .map(skill => skill.cardId);
  } catch (error) {
    ctx.throw(400, 'skill not exists');
  } finally {
    await next();
  }
});

export default router;
