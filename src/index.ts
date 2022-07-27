let domParser: DOMParser | undefined

const sanitizeEl = (el: Element | null) => {
  if (!el) {
    return el
  }

  if (el.tagName.toLowerCase() === 'script') {
    return el.remove()
  }

  for (const attr of el.attributes) {
    if (attr.name.toLowerCase().startsWith('on')) {
      el.removeAttributeNode(attr)
    }
  }

  for (let i = 0, len = el.children.length; i < len; i++) {
    const sanitized = sanitizeEl(el.children.item(i))
    if (sanitized == null) {
      // eslint-disable-next-line sonar/updated-loop-counter -- the child is removed, the index and length must be rechecked
      i--
      len--
    }
  }

  return el
}

export const sanitize = (
  domString: string,
  type: DOMParserSupportedType = 'text/html',
) => {
  if (!domParser) {
    domParser = new DOMParser()
  }

  const doc = domParser.parseFromString(domString, type)
  const els = doc.children
  return [...els].map(el => sanitizeEl(el)?.outerHTML ?? '').join('')
}

export const sanitizeSvg = (svg: string) => sanitize(svg, 'image/svg+xml')
