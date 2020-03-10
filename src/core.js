class PJAX {

  constructor(srcElements, container) {
    this.srcElements = this.toDOM(srcElements)
    this.container = this.toDOM(container)
    this.hostname = window.location.hostname

    this.beforeSendHooks = []
    this.beforeParseHooks = []
    this.beforeMountHooks = []

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
        event.preventDefault()
        this.fetch(url)
      })
    }
  }

  /**
   * setup hooks for nomal pjax request 
   */
  setupHooks() {
  
  }

  /**
   * set field of instance, change headers or other properties here
   * @param field field to be changed
   * @param value value to be assigned
   * @return undefined nothing
   */
  set(field, value) {
    this[field] = value
  }

  /**
   * register beforeSend hook
   * @param {function} func function to be execute
   * @return {undefined} nothing
   */
  beforeSend(func) {
    this.beforeSendHooks.push(func) 
  }

  /**
   * register beforeParse hook
   * @param {function} func function to be execute
   * @return {undefined} nothing
   */
  beforeParse(func) {
    this.beforeParseHooks.push(func) 
  }

  /**
   * register beforeMount hook
   * @param {function} func function to be execute
   * @return {undefined} nothing
   */
  beforeMount(func) {
    this.beforeMountHooks.push(func) 
  }

  /**
   * fetch data from url with hooks
   * @param {string} url url to be fetched
   * @return {Promise} a promise 
   */
  fetch(url) {
    let req = new Request(url)

    for (const hook of this.beforeSendHooks) {
      req = hook(req)
    }

    let parser = new DOMParser()
    let response = fetch(req)

    response.then(res => ({ 
      response: res,
      parser: parser
    }))

    for (const hook of this.beforeParseHooks) {
      response.then(hook)
    }

    response.then(data => {
      return data.parser(data.response, 'text/html')
    })

    for (const hook of this.beforeMountHooks) {
      response.then(hook)
    }

    response.then(html => {
      this.container.innerHTML = html
    })

    return response
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

export default PJAX
