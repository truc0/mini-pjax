if (!PJAX) {
  console.error('PJAX not found!')
}

let pjax = new PJAX('a', '#container')
pjax.use(pjax.request)
pjax.use(pjax.parse)
pjax.use(pjax.mount)
pjax.use(pjax.pushState)
