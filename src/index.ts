let domParser: DOMParser | undefined

export type Arrayable<T> = T | T[]

const sanitizeEl = (el: Element | null): Arrayable<Element | null | void> => {
  if (!el) {
    return el
  }

  const tagName = el.tagName.toLowerCase()

  if (['html', 'head', 'body'].includes(tagName)) {
    return [...el.children].flatMap(sanitizeEl)
  }

  if (['parsererror', 'script'].includes(tagName)) {
    return el.remove()
  }

  for (const attr of el.attributes) {
    if (attr.name.toLowerCase().startsWith('on')) {
      el.removeAttributeNode(attr)
    }
  }

  for (let i = 0, len = el.children.length; i < len; i++) {
    const sanitized = sanitizeEl(el.children[i])
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
  return [...els]
    .flatMap(el => sanitizeEl(el))
    .map(el => el?.outerHTML)
    .join('')
}

export const sanitizeSvg = (svg: string) => sanitize(svg, 'image/svg+xml')
