# felt-livereload

This is LiveReload plugin for [Felt](https://github.com/cognitom/felt)

```
const livereload = require('./index.js')

module.exports = {
  src: 'public',
  handlers: {
    '.*': livereload({root: 'public'}) // save as `src`
  }
}
```
