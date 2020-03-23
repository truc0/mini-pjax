class PJAX {
  constructor(srcElements, containers) {
    if (!this.isSupported()) {
      this.isDisabled = true
    }

    this.srcElements = this.toDOM(srcElements)
    this.hostname = window.location.hostname

    if (typeof containers === 'string') {
      this.containers = [containers]
    } else {
      this.containers = containers
    }
    
    if (!Array.isArray(this.containers)) {
      throw Error('PJAX.constructor: containers should be array or string')
    }

    this.stack = []
    this.uid = this.uuid()
    this.isDisabled = false

    this.middlewares = []

    this.setupEvents(this.srcElements)
    this.loadToState(this.containers)
    this.bindPopState()
  }

  /**
   * Copied from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
   * generate a uuid
   * @return {String} the uuid
   */
  uuid() {
    let lut = [];
    if (!this.lut) {
      this.lut = []
      for (let i=0; i<256; i++) {
        this.lut[i] = (i<16?'0':'')+(i).toString(16); 
      }
    }

    let d0 = Math.random()*0xffffffff|0;
    let d1 = Math.random()*0xffffffff|0;
    let d2 = Math.random()*0xffffffff|0;
    let d3 = Math.random()*0xffffffff|0;

    return this.lut[d0&0xff]+this.lut[d0>>8&0xff]+this.lut[d0>>16&0xff]+this.lut[d0>>24&0xff]+'-'+
    this.lut[d1&0xff]+this.lut[d1>>8&0xff]+'-'+this.lut[d1>>16&0x0f|0x40]+this.lut[d1>>24&0xff]+'-'+
    this.lut[d2&0x3f|0x80]+this.lut[d2>>8&0xff]+'-'+this.lut[d2>>16&0xff]+this.lut[d2>>24&0xff]+
    this.lut[d3&0xff]+this.lut[d3>>8&0xff]+this.lut[d3>>16&0xff]+this.lut[d3>>24&0xff];
  }

  /**
   * load the initial state to this.stack and history.state
   * @param {Array} selectors the selectors of elements that 
   *  is going to be recorded
   * @return {Undefined} nothing
   */
  loadToState(selectors) {
    let content = {}
    let state = {
      uid: null,
      contentID: null,
      info: {
        pos: null
      }
    }
    let title = document.title
    let url = window.location.href

    for (const sel of selectors) {
      let element = document.querySelector(sel)
      content[sel] = element.innerHTML
    }

    let stack = {
      content: content
    }

    state.stackID = this.stack.push(stack) - 1
    state.uid = this.uid
    state.info.pos = {
      x: window.pageXOffset,
      y: window.pageYOffset
    }

    history.replaceState(state, title, url)
  }

  /**
   * bind popstate event of history.back() and replace content
   * @return {undefined} nothing
   */
  bindPopState() {
    window.addEventListener('popstate', event => {
      if (!event.state || event.state.uid !== this.uid) {
        return   
      }

      let stackID = event.state.stackID
      event.stack = this.stack[stackID]

      let { stack, state } = event 

      // reset scroll position
      window.scrollTo(state.info.pos.x, state.info.pos.y)

      // rollback content
      this.setContent(stack.content)
    })
  }

  /** 
   * setup event for src elements, skip external link
   * @param {Array} elements source elments 
   * @return {undefined} nothing
   */
  setupEvents(elements) {
    for (const el of elements) {
      let url = el.getAttribute('href')
      if (!this.isInternal(el)) {
        continue
      }

      el.addEventListener('click', event => {
        if (this.isDisabled) {
          return  
        }

        event.preventDefault()
        
        // set up base context
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
          }
        }
        this.useMiddlewares(context)
      })
    }
  }

  /**
   * set content for elements
   * @param {Object} content key-value mapping represents selector and content
   *  for target elements
   * @return {undefined} nothing
   */
  setContent(content) {
    for (const selector in content) {
      document.querySelector(selector).innerHTML = content[selector]
    }
  }

  /**
   * use middleware by sequence
   */
  async useMiddlewares(context) {
    for (const mw of this.middlewares) {
      context = await mw.bind(this)(context)
    }
  }

  /**
   * [MIDDLEWARE]
   * construct a request and fetch it
   * @param {object} context context with request options
   * @return {Response} the response and wrapped it into context
   */
  request(context) {
    if (!context.request.url) {
      throw Error('PJAX.request: request url not found!')
    }

    context.request.headers = new Headers(context.request.headers)
    context.request._request = new Request(context.request.url, context.request)

    context.response = fetch(context.request._request)

    return context
  }

  /**
   * [MIDDLEWARE]
   * parse a response and store it in context
   */
  async parse(context) {
    if (!context.response) {
      throw Error('PJAX.parse: context.response is false or not found!')
    }
    
    let parser = new DOMParser()

    await context.response
      .then(res => res.text())
      .then(dom => context.dom = parser.parseFromString(dom, 'text/html'))

    return context
  }

  /**
   * [MIDDLEWARE]
   * mount dom element to container
   */
  mount(context) {
    if (!context.dom) {
      throw Error('PJAX.mount: context.dom not found!') 
    }

    let content = {}
    for (const selector of context.info.containers) {
      content[selector] = context.dom.querySelector(selector).innerHTML
    }

    context.functions.setContent(content)
    context.stack.content = content

    return context
  }

  /**
   * [MIDDLEWARE]
   * do pushState to history
   */
  pushState(context) {
    if (!context.state) {
      throw Error('PJAX.pushstate: context.state not found!')
    }

    let title = context.state.title || document.title
    let url = context.state.url || context.request.url
    let pos = {
      x: window.pageXOffset,
      y: window.pageYOffset
    }

    context.state.uid = context.meta.uid
    context.state.info.pos = {
      x: context.state.info.pos.x || pos.x,
      y: context.state.info.pos.y || pos.y
    }

    let stackID = this.stack.push(context.stack) - 1
    
    context.state.stackID = stackID

    history.pushState(context.state, title, url)

    return context
  }

  /**
   * check if href of a `a` tag is an internal link 
   */
  isInternal(atag) {
    return atag.host === window.location.host
  }

  /**
   * add middleware 
   * @param {function} func the middleware 
   * @return {undefined} nothing
   */
  use(func) {
    this.middlewares.push(func)
    return this
  }

  /**
   * selector to dom, do nothing if selector is already a dom element
   * @param selector selector or dom element 
   * @return {array} dom element that the selector represented
   */
  toDOM(selector) {
    if (selector instanceof NodeList) {
      return selector
    } else if (selector instanceof Element) {
      return [selector]
    } else if (typeof selector === 'string') {
      return document.querySelectorAll(selector)  
    } else {
      console.error("PJAX.toDOM: selector should be a dom element or string")
    }
  }

  /**
   * check if browser support history.pushstate
   * @return {boolean} true if browser supports this feature
   */
  isSupported() {
    return (
      history 
    && history.pushstate
    )
  }
}
