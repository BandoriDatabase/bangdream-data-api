import Router from 'koa-router';
import { apiBase } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

const api = 'event';
const router = new Router();
const eventList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].eventMap.entries).filter(elem => Number(elem.endAt) > Date.now());
  return sum;
}, {});
// console.log(eventList);
const eventBadgeList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].eventBadgeMap.entries);
  return sum;
}, {});

function getCurrEvent() {
  const currentEvent = Object.keys(eventList).reduce((sum, region) => {
    const currEvent = eventList[region].find(elem =>
      (Number(elem.endAt) > Date.now() && Number(elem.startAt) < Date.now()) ||
      (Number(elem.endAt) > Date.now() && Number(elem.startAt) > Date.now()))
      || eventList[region][0];
    if (currEvent.eventType === 'challenge') {
      currEvent.detail = dbMap[region].challengeEventMap.entries[currEvent.eventId];
    } else if (currEvent.eventType === 'story') {
      currEvent.detail = dbMap[region].storyEventMap.entries[currEvent.eventId];
    } else if (currEvent.eventType === 'versus') {
      currEvent.detail = dbMap[region].versusEventMap.entries[currEvent.eventId];
    } else if (currEvent.eventType === 'live_try') {
      currEvent.detail = dbMap[region].liveTryEventMap.entries[currEvent.eventId];
    }
    sum[region] = currEvent;
    return sum;
  }, {});
  return currentEvent;
}

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  const currentEvent = getCurrEvent();
  ctx.body = currentEvent[ctx.params.server];
  await next();
});

router.get('/badge/:id(\\d{1,4})', async (ctx, next) => {
  try {
    ctx.body = eventBadgeList[ctx.params.server].find(elem => elem.eventId === Number(ctx.params.id));
  } catch (error) {
    ctx.throw(400, 'event badge not exists');
  } finally {
    await next();
  }
});

export default router;
