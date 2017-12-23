import Router from 'koa-router';
import path from 'path';
import fs from 'fs';
import fetch from 'isomorphic-fetch';
import bms from 'bms';
import { apiBase, pageLimit } from '../config';
import { dbJP, dbTW } from '../db';
// import mapToList from '../utils/mapToList';

const api = 'music';
const router = new Router();
const musicList = {
  jp: dbJP.musicList.entries.slice().reverse(),
  tw: dbTW.musicList.entries.slice().reverse(),
};
const musicDiffiList = {
  jp: dbJP.musicDifficultyList.entries,
  tw: dbTW.musicDifficultyList.entries,
};
const bandMap = {
  jp: dbJP.bandMap.entries,
  tw: dbTW.bandMap.entries,
};

router.prefix(`${apiBase}/${api}`);

router.get('/', async (ctx, next) => {
  // query accept 'bandId', 'limit', 'page', 'orderkey', 'sort'
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
  ctx.body = musicList[ctx.params.server].map(music => Object.assign({}, music, {
    bgmFile: `/assets/sound/${music.bgmId}.mp3`,
    jacket: `/assets/musicjacket/${music.jacketImage}_jacket.png`,
    bandName: bandMap[ctx.params.server][music.bandId].bandName,
  }));
  if (ctx.query.bandId) {
    ctx.body = ctx.body
      .filter(music => ctx.query.bandId.includes(music.bandId.toString()));
  }
  if (ctx.query.sort && ctx.query.orderKey) {
    if (ctx.query.sort === 'asc') ctx.body = ctx.body.sort((a, b) => a[ctx.query.orderKey] - b[ctx.query.orderKey]);
    else if (ctx.query.sort === 'desc') ctx.body = ctx.body.sort((a, b) => b[ctx.query.orderKey] - a[ctx.query.orderKey]);
  }
  ctx.body = ctx.body.slice((page - 1) * limit, page * limit);
  if (!ctx.body.length) {
    ctx.throw(400, 'query length exceed limit');
    ctx.body = null;
  } else {
    ctx.body = {
      totalCount: ctx.body.length,
      data: ctx.body,
    };
  }
  await next();
});

router.get('/:id(\\d{1,4})', async (ctx, next) => {
  try {
    ctx.body = musicList[ctx.params.server].find(elem => elem.musicId === Number(ctx.params.id));
    ctx.body.difficulty = musicDiffiList[ctx.params.server].filter(elem => elem.musicId === Number(ctx.params.id));
    ctx.body.combo = ctx.body.difficulty[0].combo;
    ctx.body.bandName = bandMap[ctx.params.server][ctx.body.bandId].bandName;
  } catch (error) {
    console.log(error);
    ctx.throw(400, 'music not exists');
  } finally {
    await next();
  }
});

router.get('/chart/:id(\\d{1,4})/:difficulty(\\w+)', async (ctx, next) => {
  try {
    const music = musicList[ctx.params.server].find(elem => elem.musicId === Number(ctx.params.id));
    const localChartFileName = path.join(
      __dirname,
      '../../cache/musicscore',
      `${String(music.musicId).padStart(3, '0')}_${music.chartAssetBundleName}_${ctx.params.difficulty}.json`,
    );
    if (!fs.existsSync(localChartFileName)) {
      // no cached file here, fetch a new one
      const remoteChartFileName = `https://res.bangdream.ga/assets/musicscore/${String(music.musicId).padStart(3, '0')}_${music.chartAssetBundleName}_${ctx.params.difficulty}.txt`;
      const res = await (await fetch(remoteChartFileName)).text();
      const { chart } = bms.Compiler.compile(res);
      const Segments = bms.Timing.fromBMSChart(chart)._speedcore._segments;
      let Notes = bms.Notes.fromBMSChart(chart)._notes.sort((a, b) => a.beat - b.beat);
      const Keysounds = bms.Keysounds.fromBMSChart(chart)._map;

      // map note type
      const keyMap = {
        'flick.wav': 'Flick',
        'bd.wav': 'SingleOrLong',
        'fever_note.wav': 'FeverSingle',
        'fever_note_flick.wav': 'FeverFlick',
        'slide_a.wav': 'Slide_A',
        'slide_end_a.wav': 'Slide_End_A',
        'slide_b.wav': 'Slide_B',
        'slide_end_b.wav': 'Slide_End_B',
        'skill.wav': 'Skill',
        'slide_end_flick_a.wav': 'Slide_End_Flick_A',
        'slide_end_flick_b.wav': 'Slide_End_Flick_B',
        'cmd_fever_ready.wav': 'Cmd_Fever_Ready',
        'cmd_fever_start.wav': 'Cmd_Ferver_Start',
        'cmd_fever_end.wav': 'Cmd_Fever_End',
      };
      // map note timing
      Notes = Notes.filter(note =>
        ['cmd_fever_ready.wav', 'cmd_fever_start.wav', 'cmd_fever_end.wav']
          .indexOf(Keysounds[note.keysound.toLowerCase()]) === -1);
      Notes.forEach((note, idx) => {
        const { bpm, t, x } = Segments.filter(elem => elem.x <= note.beat).slice(-1)[0];
        const beatInterval = 60 / bpm;
        // if (!keyMap[Keysounds[note.keysound.toLowerCase()]]) console.log(Keysounds[note.keysound.toLowerCase()]);
        switch (Keysounds[note.keysound.toLowerCase()]) {
          case 'bd.wav': {
            if (note.endBeat) note.type = 'Long';
            else note.type = 'Single';
            break;
          }
          default:
            note.type = keyMap[Keysounds[note.keysound.toLowerCase()]] || 'Music';
            break;
        }
        note.timing = (beatInterval * (note.beat - x)) + t;
        if (note.endBeat) note.endTiming = (beatInterval * (note.endBeat - x)) + t;
        note.index = idx;
      });

      fs.writeFileSync(localChartFileName, JSON.stringify(Notes));
      ctx.body = Notes;
    } else {
      ctx.body = JSON.parse(fs.readFileSync(localChartFileName));
    }
  } catch (error) {
    console.log(error);
    ctx.throw(400, 'music not exists');
  } finally {
    await next();
  }
});

export default router;
