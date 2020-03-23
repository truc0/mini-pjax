# Mini PJAX
Mini pjax is a tiny library to enable `PJAX` with `history.pushState()` in your project. It is super small (less than *4KB* after minify) powerful.


## Features
Heres some features of Mini-pjax:
* multi-instance
* highly customize
* using latest Javascript features like `fetch` and `class`


## Installation
Download file from [master](https://raw.githubusercontent.com/wozuishuai13768/mini-pjax/master/index.js) branch or [develop](https://raw.githubusercontent.com/wozuishuai13768/mini-pjax/develop/index.js) branch and use it as a normal script file.

```html
<script src="/path/to/your/file/index.js">
```


## Usage
You can find some examples in the `example/js/index.js` folder in this repository.

### Basic usage
```js
// PJAX is a class, use it like PJAX(<selector>, <containerID>)
let pjax = new PJAX('a.pjax', '#container')

// add default middlewares
pjax.use(pjax.request)
pjax.use(pjax.parse)
pjax.use(pjax.mount)
pjax.use(pjax.pushState)
```

### Customize with middlewares
In mini-pjax, all functions are considered as middlewares. You can add your own middlewares to customize it. Every middleware get `context` as the only argument. `Context` is an object that storing request options, response, the parsedDOM and helper functions. Take a look at the source code of default middlewares to exactly know how context is changed during processing. Here is an example of middleware.

```js
function changeUserAgent(context) {
  context.request.headers['Cache-Control'] = 'no-cache'

  // remember to return context after processing
  return context 
}
```

#### `this` in middlewares
In middlewares of mini-pjax project, `this` are pointed to the PJAX instance. You can access PJAX method using `this`. **However, it is suggested that use `this` to change properties of the PJAX instance ONLY when you cannot find another solution.**

#### Context in detailed
The initial context has the following properties.
```js
const context = {
  state: {
    info: {
      pos: {}
    },
    uid: null
  },
  stack: {
    content: {}
  },
  meta: {
    uid: this.uid
  },
  info: {
    event: event,
    containers: this.containers
  },
  functions: {
    setContent: this.setContent
  },
  request: {
    url: url,
    headers: {
      'X-PJAX': 'TRUE',
      'Content-Type': 'text/html; charset=UTF-8'
    }
  },
  dom: undefined
}
```
