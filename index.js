class PJAX {
  constructor(srcElements, containerID) {
    if (!isSupported) {
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
    this.isDisabled = false

    this.middlewares = []

    this.setupEvents()
  }

  /** 
   * setup event for src elements, skip external link
   * @param {Array} elements source elments 
   * @return {undefined} nothing
   */
  setupEvents(elements) {
    for (const el of elements) {
      let url = el.getAttribute('href')
      if (!this.isInternal(url)) {
        continue
      }

      el.addEventListener('click', event => {
        if (this.isDisabled) {
          return  
        }

        event.preventDefault()
        this.useMiddlewares()
      })
    }
  }

  /**
   * use middleware by sequence
   */
  useMiddlewares() {
    const context = {
    }

    for (const mw of middlewares) {
      context = mw(context)
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
  parse(context) {
    if (!context.response) {
      throw Error('PJAX.parse: context.response is false or not found!')
    }

    let parser = new DOMParser()

    context.dom = parser.parseFromString(context.response.text(), 'text/html')

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

    let resContainer = context.dom.querySelector(this.containerID)

    this.container.innerHTML = resContainer.innerHTML

    return context
  }

  /**
   * check if href of a `a` tag is an internal link 
   */
  isInternal(aTag) {
    return aTag.host === window.location.host
  }

  /**
   * add middleware 
   * @param {function} func the middleware 
   * @return {undefined} nothing
   */
  use(func) {
    this.middlewares.push(func)
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
}
