import fs from 'fs';
import fetch from 'isomorphic-fetch';
import { masDBAddr } from '../config';

const remoteAddr = {
  development: 'http://localhost:8080',
  production: 'https://res.bangdream.ga',
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
      console.log('got a new tw masterdb, please restart server');
      // exit for auto reload, use with supervisord or similar tools
      process.exit(1);
    });
};
