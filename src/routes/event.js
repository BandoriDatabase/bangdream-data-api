import Router from 'koa-router';
import { apiBase, masterdb } from '../config';
import mapToList from '../utils/mapToList';

const api = 'event';
const router = new Router();
const currentEvent = mapToList(masterdb.eventMap.entries).find(elem => elem.enableFlag);
if (currentEvent.eventType === 'challenge') {
  currentEvent.detail = masterdb.challengeEventDetailMap.entries[currentEvent.eventId];
}
const eventBadgeList = mapToList(masterdb.eventBadgeMap.entries);

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  ctx.body = currentEvent;
  await next();
});

router.get('/badge/:id(\\d{1,4})', async (ctx, next) => {
  ctx.body = eventBadgeList.find(elem => elem.eventId === ctx.params.id);
  await next();
});

export default router;
