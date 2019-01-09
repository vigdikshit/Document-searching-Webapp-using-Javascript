'use strict';

const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const process = require('process');
const url = require('url');
const queryString = require('querystring');

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;


//Main URLs
const DOCS = '/docs';
const COMPLETIONS = '/completions';

//Default value for count parameter
const COUNT = 5;

/** Listen on port for incoming requests.  Use docFinder instance
 *  of DocFinder to access document collection methods.
 */
function serve(port, docFinder) {
  const app = express();
  app.locals.port = port;
  app.locals.finder = docFinder;
  setupRoutes(app);
  const server = app.listen(port, async function() {
    console.log(`PID ${process.pid} listening on port ${port}`);
  });
  return server;
}

module.exports = { serve };

function setupRoutes(app) {
  app.use(cors());            //for security workaround in future projects
  app.use(bodyParser.json()); //all incoming bodies are JSON

  //@TODO: add routes for required 4 services
  app.get(`${DOCS}/:name`, getContent(app));
  app.get(`${DOCS}`, searchContent(app));
  app.post(`${DOCS}`, adContent(app));
  app.get(`${COMPLETIONS}`, getCompletions(app));
  app.use(doErrors());
}

//@TODO: add handler creation functions called by route setup
//routine for each individual web service.  Note that each
//returned handler should be wrapped using errorWrap() to
//ensure that any internal errors are handled reasonably

function getContent(app){
    return errorWrap(async function(req, res) {
        try {
            const name = req.params.name;
            const results = await app.locals.finder.docContent(name);
            if (results.length === 0) {
                throw {
                    isDomain: true,
                    errorCode: NOT_FOUND,
                    message: `Document ${name} not found`,
                };
            }
            else {
                res.json({
                    content : results,
                    links : [
                        {
                          rel : 'self',
                          href : `http://localhost:1235/docs/${name}`
                        }
                    ]
                });
            }
        }
        catch(err) {
            err.isDomain = true;
            const mapped = mapError(err);
            res.status(mapped.status).json(mapped);
        }
    });
}

function searchContent(app){
    return errorWrap(async function(req, res) {
        try {
            let name = "";
            let count;
            let start;
            let c = 0;
            let link = {};
            let search = req.query.q;
            let result = [];
            let rs = {};
            let self;
            let next;
            let previous;
            count = req.query.count;
            start = req.query.start;
            if(start === undefined){
              start = 0;
            }
            if(count === undefined){
                count = 5;
            }
            start = parseInt(start);
            count = parseInt(count);
            const results = await app.locals.finder.find(search);
            for (let i = 0; i < results.length; i++) {
                name = results[i].name;
                results[i].href = `http://localhost:1235/docs/${name}`;
            }
            let r = Object.values(results);
            for (let i = start; i < r.length; i++) {
                result.push(r[i]);
                c++;
                if (c === count) {
                    break;
                }
            }
            for (let i = 0; i < result.length; ++i){
                  if (result[i] !== undefined)
                  rs[result[i].key] = result[i].value;
            }
            if (results.length === 0) {
                throw {
                    isDomain: true,
                    errorCode: 'NOT_FOUND',
                    message: `Word ${search} not found`,
                };
            } else {
                search = search.replace(' ', '%20');
                self = `http://localhost:1235/docs?q=${search}&start=${start}&count=${count}`;
                if (start >= 0 && count >=0) {
                    let diff = start - count;
                    let sum = start + count;
                    if(diff < 0){
                        diff = 0;
                    }
                    next = `http://localhost:1235/docs?q=${search}&start=${sum}&count=${count}`;
                    previous = `http://localhost:1235/docs?q=${search}&start=${diff}&count=${count}`;
                    if(start === 0 && count >= results.length){
                        link = [{
                            rel: 'self', href: self
                        }];
                    } else if(start === 0){
                        link = [{
                            rel: 'self', href: self
                        }, {
                            rel: 'next', href: next
                        }];
                    }else if(sum > results.length){
                        link = [{
                            rel: 'self', href: self
                        }, {
                            rel: 'previous', href: previous
                        }];
                    }
                    else if(start > 0 && count < results.length){
                        link = [{
                            rel: 'self', href: self
                        }, {
                            rel: 'next', href: next
                        },{
                            rel: 'previous', href: previous
                        }];
                    }
                    res.json({
                        results: result,
                        totalCount: results.length,
                        links: link
                    });
                }else{
                    res.json({
                        code: 'BAD_PARAM',
                        message: 'bad query parameter'
                    });
                }
            }
        }
        catch(err) {
            err.isDomain = true;
            const mapped = mapError(err);
            res.status(mapped.status).json(mapped);
        }
    });
}

function adContent(app){
    return errorWrap(async function(req, res) {
        try {
            const obj = req.body;
            const results = await app.locals.finder.addContent(obj.name, obj.content);
            res.append('Location', requestUrl(req) + '/' + obj.name);
            res.status(CREATED);
            res.json({
                href: `http://localhost:1235/docs/${obj.name}`
            });
        }
        catch(err) {
            const mapped = mapError(err);
            res.status(mapped.status).json(mapped);
        }
    });
}

function getCompletions(app){
    return errorWrap(async function(req, res) {
        try {
            const name = req.query.text;
            const results = await app.locals.finder.complete(name);
            if (results.length === 0) {
                throw {
                    isDomain: true,
                    errorCode: 'NOT_FOUND',
                    message: `Document ${name} not found`,
                };
            }
            else {
                res.json(results);
            }
        }
        catch(err) {
            const mapped = mapError(err);
            res.status(mapped.status).json(mapped);
        }
    });
}
/** Return error handler which ensures a server error results in nice
 *  JSON sent back to client with details logged on console.
 */ 
function doErrors(app) {
  return async function(err, req, res, next) {
    res.status(SERVER_ERROR);
    res.json({ code: 'SERVER_ERROR', message: err.message });
    console.error(err);
  };
}

/** Set up error handling for handler by wrapping it in a 
 *  try-catch with chaining to error handler on error.
 */
function errorWrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    }
    catch (err) {
      next(err);
    }
  };
}

const ERROR_MAP = {
    EXISTS: CONFLICT,
    NOT_FOUND: NOT_FOUND
}

function mapError(err) {
    return err.isDomain
        ? { status: (ERROR_MAP[err.code] || BAD_REQUEST),
            code: err.code,
            message: err.message
        }
        : { status: BAD_REQUEST,
            code: 'BAD_PARAM',
            message: 'required query parameter is missing'
        };
}

function requestUrl(req) {
    const port = req.app.locals.port;
    return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}