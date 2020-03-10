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

    this.beforeRequestHooks = []
    this.beforeMountHooks = []
    this.mountedHooks = []

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
        this.fetch(url)
      })
    }
  }

  /**
   * check if href of a `a` tag is an internal link 
   */
  isInternal(aTag) {
    return aTag.host === window.location.host
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
  beforeRequest(func) {
    this.beforeSendHooks.push(func) 
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
   * register mounted hooks 
   * @param {function} func function to be execute
   * @return {undefined} nothing
   */
  mounted(func) {
    this.mountedHooks.push(func) 
  }

  /**
   * parse text to DOM 
   * @param {Response} res the response object
   * @return {DOMElement} the parsed DOM
   */
  useDefaultParser(res) {
    if (!this.parser) {
      this.parser = new DOMParser()
    }
    return this.parser.parseFromString(res)
  }

  /**
   * selector container from new DOM 
   * @param {string} selector the selector 
   * @return {function} a function that recieve a DOM element as a argument
   *  and return the selected element in this DOM element
   */
  useSelector(selector=this.containerID) {
    const getElement = dom => dom.querySelector(selector)
    return getElement
  }

  /**
   * convert response to response.text 
   * @param {Response} res response 
   * @return response.text()
   */
  useToText(res) {
    return res.text()
  }

  /**
   * fetch data from url with hooks
   * @param {string} url url to be fetched
   * @return {Promise} a promise 
   */
  fetch(url) {
    let reqOptions = {
      url: url,
      params: {}
    }

    for (const hook of this.beforeSendHooks) {
      reqOptions = hook(reqOptions)
    }

    let response = fetch(reqOptions.url, reqOptions.params)

    for (const hook of this.beforeMountHooks) {
      response.then(hook)
    }

    response.then(newContainer => {
      this.container.innerHTML = newContainer.innerHTML
      this.stack.push(newContainer)
      return newContainer
    })

    for (const hook of this.mountedHooks) {
      response.then(hook)
    }

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
