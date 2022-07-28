let domParser: DOMParser | undefined

const isDocument = (el: Document | Element): el is Document =>
  el.nodeType === el.DOCUMENT_NODE

const sanitizeAttributes = (el: Element) => {
  const attrs = el.attributes
  for (let i = 0, len = attrs.length; i < len; i++) {
    const attr = attrs[i]
    if (
      attr.name.toLowerCase().startsWith('on') ||
      attr.value.toLowerCase().startsWith('javascript:')
    ) {
      el.removeAttributeNode(attr)
      // eslint-disable-next-line sonar/updated-loop-counter -- the attribute is removed, the index and length must be rechecked
      i--
      len--
    }
  }
  return el
}

const sanitizeChildren = <T extends Document | Element>(el: T) => {
  for (let i = 0, len = el.children.length; i < len; i++) {
    const sanitized = sanitizeNode(el.children[i])
    if (sanitized == null) {
      // eslint-disable-next-line sonar/updated-loop-counter -- the child is removed, the index and length must be rechecked
      i--
      len--
    }
  }
  return el
}

function sanitizeNode(el: Document): Document
function sanitizeNode(el: Element): Element | null
function sanitizeNode(el: Document | Element) {
  if (isDocument(el)) {
    return sanitizeChildren(el)
  }

  const tagName = el.tagName.toLowerCase()

  if (['parsererror', 'script'].includes(tagName)) {
    el.remove()
    return null
  }

  return sanitizeChildren(sanitizeAttributes(el))
}

export const TEXT_HTML = 'text/html'
export const IMAGE_SVG_XML = 'image/svg+xml'

export const sanitize = (
  domString: string,
  type: DOMParserSupportedType = TEXT_HTML,
) => {
  if (!domParser) {
    domParser = new DOMParser()
  }

  const doc = sanitizeNode(domParser.parseFromString(domString, type))

  return (
    ((type !== IMAGE_SVG_XML ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- `document.body` is unavailable in XML, see also https://github.com/microsoft/TypeScript/issues/29052#issuecomment-447998135
      !doc.body) &&
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- https://github.com/microsoft/TypeScript/issues/50078
      doc.documentElement?.outerHTML) ||
    ''
  )
}

export const sanitizeSvg = (svg: string) => sanitize(svg, IMAGE_SVG_XML)
