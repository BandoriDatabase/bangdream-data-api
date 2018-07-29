import fs from 'fs';
import fetch from 'isomorphic-fetch';
import { masDBAddr } from '../config';

const remoteAddr = {
  development_local: 'http://localhost:8080',
  development: 'https://res.bandori.ga',
  production: 'https://res.bandori.ga',
};

export default () => {
  fetch(`${remoteAddr[process.env.NODE_ENV]}/static/MasterDB_jp.json`)
    .then(res => res.text())
    .then((res) => {
      fs.writeFileSync(masDBAddr.jp, res);
      console.log('got a new jp masterdb');
      return fetch(`${remoteAddr[process.env.NODE_ENV]}/static/MasterDB_tw.json`);
    })
    .then(res => res.text())
    .then((res) => {
      fs.writeFileSync(masDBAddr.tw, res);
      console.log('got a new tw masterdb');
      return fetch(`${remoteAddr[process.env.NODE_ENV]}/static/MasterDB_kr.json`);
      // console.log(`got a new tw masterdb, please restart server, time: ${(new Date()).toISOString()}`);
      // exit for auto reload, use with supervisord or similar tools
      // process.exit(1);
    })
    .then(res => res.text())
    .then((res) => {
      fs.writeFileSync(masDBAddr.kr, res);
      console.log('got a new kr masterdb');
      return fetch(`${remoteAddr[process.env.NODE_ENV]}/static/MasterDB_en.json`);
    })
    .then(res => res.text())
    .then((res) => {
      fs.writeFileSync(masDBAddr.en, res);
      console.log('got a new en masterdb');
      console.log(`please restart server, time: ${(new Date()).toISOString()}`);
      // exit for auto reload, use with supervisord or similar tools
      process.exit(1);
    });
};
