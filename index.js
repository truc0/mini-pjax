class PJAX {
  constructor(srcElements, containerID) {
    if (!this.isSupported()) {
      this.isDisabled = true
    }

    this.srcElements = this.toDOM(srcElements)
    this.hostname = window.location.hostname

    if (typeof containerID !== 'string') {
      this.container = containerID
      this.containerID = this.container.getAttribute('ID')
    } else {
      this.containerID = containerID
      this.container = this.toDOM(containerID)
    }

    this.stack = []
    this.uid = 'uid' // CHANGE IT LATER
    this.isDisabled = false

    this.middlewares = []

    this.setupEvents(this.srcElements)
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
          meta: {
            uid: this.uid
          },
          info: {
            event: event,
            containerID: this.containerID
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
   * use middleware by sequence
   */
  async useMiddlewares(context) {
    for (const mw of this.middlewares) {
      context = await mw(context)
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

    let resContainer = context.dom.querySelector(
      context.info.containerID
    )

    let container = document.querySelector(context.info.containerID)
    let prevContent = container.innerHTML
    container.innerHTML = resContainer.innerHTML

    context.state.info = {
      container: context.info.containerID,
      content: prevContent
    }

    return context
  }

  /**
   * [MIDDLEWARE]
   * do pushState to history
   */
  pushState(context) {
    if (!context.state) {
      throw Error('PJAX.pushState: context.state not found!')
    }

    let title = context.state.title || document.title
    let url = context.state.url || context.request.url
    let pos = {
      x: window.pageXOffset,
      y: window.pageYOffset
    }

    context.state.uid = context.meta.uid
    context.state.info.pos = context.state.info.pos || pos

    history.pushState(context.state, title, url)

    return context
  }

  /**
   * check if href of a `a` tag is an internal link 
   */
  isInternal(aTag) {
    console.log(aTag.host)
    return aTag.host === window.location.host
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
   * selector to DOM, do nothing if selector is already a DOM element
   * @param selector selector or DOM element 
   * @return {Array} DOM element that the selector represented
   */
  toDOM(selector) {
    if (selector instanceof NodeList) {
      return selector
    } else if (selector instanceof Element) {
      return [selector]
    } else if (typeof selector === 'string') {
      return document.querySelectorAll(selector)  
    } else {
      console.error("PJAX.toDOM: selector should be a DOM element or string")
    }
  }

  /**
   * check if browser support history.pushState
   * @return {boolean} true if browser supports this feature
   */
  isSupported() {
    return (
      history 
    && history.pushState
    )
  }
}
