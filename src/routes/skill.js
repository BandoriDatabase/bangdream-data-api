import Router from 'koa-router';
import { apiBase } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

const api = 'skill';
const router = new Router();
const skillMapList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].masterSituationSkillMap.entries);
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
const skillActivateEffectList = Object.keys(dbMap).reduce((sum, region) => {
  if (dbMap[region].masterSkillActivateEffectList) {
    sum[region] = dbMap[region].masterSkillActivateEffectList.entries;
  }
  return sum;
}, {});
const skillOnceEffectList = Object.keys(dbMap).reduce((sum, region) => {
  if (dbMap[region].masterSkillOnceEffectList) {
    sum[region] = dbMap[region].masterSkillOnceEffectList.entries;
  }
  return sum;
}, {});

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  ctx.body = skillList[ctx.params.server].reduce((prev, curr) => {
    if (prev.find(elem2 => elem2.skillId === curr.skillId)) return prev;
    prev.push(curr);
    return prev;
  }, []);
  await next();
});

router.get('/cardId/:cardId(\\d+)', async (ctx, next) => {
  try {
    ctx.body = skillMap[ctx.params.server][ctx.params.cardId];
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

router.get('/:id(\\d+)', async (ctx, next) => {
  try {
    ctx.body = skillList[ctx.params.server]
      .find(skill => skill.skillId === Number(ctx.params.id));
  } catch (error) {
    ctx.throw(400, 'skill not exists');
  } finally {
    await next();
  }
});

router.get('/cards/:id(\\d+)', async (ctx, next) => {
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
