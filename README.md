# Bandori Database Public API Project
This repository provides the public API of Bandori Database and its documentation.

## Dependencies
- `Node.js > v8.6.0`

## Deployment
Running following commands to set up this repo:
```bash
git clone https://github.com/BandoriDatabase/bangdream-data-api.git
cd bangdream-data-api
npm i --production
# ALLOW_API_KEY is sent when you want to update the data remotely
# As it will exit after data update, I recommend that you use supervisor 
# or circusd to start this api server
ALLOW_API_KEY=your_private_key node index.js
```

## Development
Just clone this repo and run `npm i`, then run `npm run dev` to start dev server. It uses `nodemon` to watch file changes. `ALLOW_API_KEY` is set to *testkey*.

### Update Swagger Api Documentation
The API Documentation uses Swagger OpenAPI Documentation. You can find a Swagger Editor to edit the `swagger.json` file and check it out at http://localhost:8180/docs.