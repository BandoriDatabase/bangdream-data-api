import Koa from 'koa';
import logger from 'koa-logger';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import koaSwagger from 'koa2-swagger-ui';
import koaSend from 'koa-send';

import { port } from './config';
import routesLoader from './utils/routesLoader';

require('./bootstrap');

const app = new Koa();
require('koa-qs')(app);

if (process.env.NODE_ENV === 'development') {
  app.use(logger());
}

app
  .use(bodyParser())
  .use(cors());

app.use(koaSwagger({
  swaggerOptions: {
    url: '/swagger.json', // example path to json
  },
}));

app.use(async (ctx, next) => {
  if (ctx.path === '/swagger.json') {
    await koaSend(ctx, ctx.path);
  } else {
    await next();
  }
});

if (!global.isFirstStart) {
  routesLoader(`${__dirname}/routes`).then((files) => {
    files.forEach((route) => {
      app
        .use(route.routes())
        .use(route.allowedMethods({
          throw: true,
        }));
    });
  });
}

app.listen(
  port,
  () => console.log(`✅  The server is running at http://localhost:${port}/`),
);
