'use strict'

if (!process.EventEmitter) {
  /* This is required because process.EventEmitter is deprecated */
  process.EventEmitter = require('events')
}

const
  fs = require('fs'),
  path = require('path'),
  fsp = require('fs-promise'),
  livereload = require('livereload-server'),
  co = require('co')

let
  port = 35729,
  timeout = 1500,
  lrServer = null

function startLivereload(options) {
  if (lrServer) return;

  lrServer = new livereload({
    id: 'default id',
    name: 'default name',
    version: '1.0',
    protocols: {
      monitoring: 7,
      saving: 1
    },
    port: port
  });

  lrServer.on('livereload.js', function(req, res) {
    const lrjs = path.join(require.resolve('livereload-js'), '../../dist/livereload.js')
    fs.readFile(lrjs, 'utf8', function(err, data) {
      if (err) throw err;
      res.writeHead(200, {
        'Content-Length': data.length,
        'Content-Type': 'text/javascript'
      });
      res.end(data);
    });
  });

  lrServer.listen(function(err) {
    if (err) {
      throw err
    }
  })

}

function reload (path) {
  console.log('Reloading:', path)
  Object.keys(lrServer.connections).forEach(function(id) {
    try {
      lrServer.connections[id].send({
        command: 'reload',
        path,
        liveCSS: true
      })
    } catch (err) {
      console.error('Livereload error:', err)
    }
  })
}

const code = `<script src="//localhost:${port}/livereload.js?snipver=1"></script>`
  + `<script>document.addEventListener('LiveReloadDisconnect', function() { setTimeout(function() { window.location.reload(); }, ${timeout}) })</script>`

module.exports = function(config) {
  startLivereload()
  if (!config) {
    config = {}
  }

  if (!config.root) {
    config.root = '.'
  }

  return co.wrap(function* (from, to){
    if (from.endsWith('.html')) {
      const body = yield fsp.readFile(from, 'utf8')
      yield fsp.writeFile(to, body + code)
    }

    reload(path.relative(config.root, from))
  })
}
