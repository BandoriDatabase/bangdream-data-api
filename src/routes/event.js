import Router from 'koa-router';
import { apiBase } from '../config';
import dbMap from '../db';
import mapToList from '../utils/mapToList';

const api = 'event';
const router = new Router();
const eventList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].eventMap.entries);
  return sum;
}, {});
const eventBadgeList = Object.keys(dbMap).reduce((sum, region) => {
  sum[region] = mapToList(dbMap[region].eventBadgeMap.entries);
  return sum;
}, {});

function getCurrEvent(region) {
  const nextEvents = eventList[region].filter(elem =>
    (Number(elem.endAt) > Date.now() && Number(elem.startAt) < Date.now()) ||
    (Number(elem.endAt) > Date.now() && Number(elem.startAt) > Date.now()))
    || eventList[region].slice(-1)[0];
  let currEvent = nextEvents.find(elem =>
    (Number(elem.endAt) > Date.now() && Number(elem.startAt) < Date.now()));
  if (!currEvent) {
    currEvent = nextEvents.find(elem =>
      (Number(elem.endAt) > Date.now() && Number(elem.startAt) > Date.now()))
      || eventList[region].slice(-1)[0];
  }
  if (currEvent.eventType === 'challenge') {
    currEvent.detail = dbMap[region].challengeEventMap.entries[currEvent.eventId];
  } else if (currEvent.eventType === 'story') {
    currEvent.detail = dbMap[region].storyEventMap.entries[currEvent.eventId];
  } else if (currEvent.eventType === 'versus') {
    currEvent.detail = dbMap[region].versusEventMap.entries[currEvent.eventId];
  } else if (currEvent.eventType === 'live_try') {
    currEvent.detail = dbMap[region].liveTryEventMap.entries[currEvent.eventId];
  } else if (currEvent.eventType === 'mission_live') {
    currEvent.detail = dbMap[region].missionLiveEventMap.entries[currEvent.eventId];
  }
  return currEvent;
}

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  ctx.body = getCurrEvent(ctx.params.server);
  await next();
});

router.get('/badge/:id(\\d+)', async (ctx, next) => {
  try {
    ctx.body = eventBadgeList[ctx.params.server].find(elem => elem.eventId === Number(ctx.params.id));
  } catch (error) {
    ctx.throw(400, 'event badge not exists');
  } finally {
    await next();
  }
});

export default router;
