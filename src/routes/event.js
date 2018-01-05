import Router from 'koa-router';
import { apiBase } from '../config';
import { dbJP, dbTW } from '../db';
import mapToList from '../utils/mapToList';

const api = 'event';
const router = new Router();
const eventList = {
  jp: mapToList(dbJP.eventMap.entries),
  tw: mapToList(dbTW.eventMap.entries),
};
const eventBadgeList = {
  jp: mapToList(dbJP.eventBadgeMap.entries),
  tw: mapToList(dbTW.eventBadgeMap.entries),
};

function getCurrEvent() {
  const currentEvent = {
    jp: eventList.jp
      .find(elem => elem.enableFlag &&
        Number(elem.publicStartAt) < Date.now() &&
        Number(elem.publicEndAt) > Date.now()),
    tw: eventList.tw
      .find(elem => elem.enableFlag &&
        Number(elem.publicStartAt) < Date.now() &&
        Number(elem.publicEndAt) > Date.now()),
  };
  if (!currentEvent.jp) {
    console.log('no current jp event, database must be wrong');
    [currentEvent.jp] = mapToList(dbJP.eventMap.entries).slice(-1);
  }
  if (currentEvent.jp.eventType === 'challenge') {
    currentEvent.jp.detail = dbJP.challengeEventDetailMap.entries[currentEvent.jp.eventId];
  } else if (currentEvent.jp.eventType === 'story') {
    currentEvent.jp.detail = dbJP.storyEventMap.entries[currentEvent.jp.eventId];
  } else if (currentEvent.jp.eventType === 'versus') {
    currentEvent.jp.detail = dbJP.versusEventMap.entries[currentEvent.jp.eventId];
  }
  if (!currentEvent.tw) {
    console.log('no current tw event, database must be wrong');
    [currentEvent.tw] = mapToList(dbTW.eventMap.entries).slice(-1);
  }
  if (currentEvent.tw.eventType === 'challenge') {
    currentEvent.tw.detail = dbTW.challengeEventDetailMap.entries[currentEvent.tw.eventId];
  } else if (currentEvent.tw.eventType === 'story') {
    currentEvent.tw.detail = dbTW.storyEventMap.entries[currentEvent.tw.eventId];
  } else if (currentEvent.tw.eventType === 'versus') {
    currentEvent.tw.detail = dbTW.versusEventMap.entries[currentEvent.tw.eventId];
  }
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
