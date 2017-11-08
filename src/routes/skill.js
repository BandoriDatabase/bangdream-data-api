import Router from 'koa-router';
import { apiBase, masterdb } from '../config';
import mapToList from '../utils/mapToList';

const api = 'skill';
const router = new Router();
const skillList = mapToList(masterdb.skillMap.entries);

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  ctx.body = masterdb.skillInfos.entries.reduce((prev, curr) => {
    if (prev.find(elem2 => elem2.skillId === curr.skillId)) return prev;
    prev.push(curr);
    return prev;
  }, []);
  await next();
});

router.get('/cardId/:cardId(\\d{1,4})', async (ctx, next) => {
  ctx.body = skillList.find(skill => skill.cardId === ctx.params.cardId);
  ctx.body.skillDetail = masterdb.skillInfos.entries
    .filter(skill => skill.skillId === ctx.body.skillId);
  ctx.body.skillEffect = masterdb.skillEffects.entries
    .filter(se => se.skillId === ctx.body.skillId);
  ctx.body.judgeEffect = masterdb.judgeLists.entries
    .filter(se => se.skillId === ctx.body.skillId);
  await next();
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  ctx.body = skillList.filter(skill => skill.skillId === ctx.params.id).map(skill => skill.cardId);
  await next();
});

export default router;
