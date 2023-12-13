let domParser: DOMParser | undefined

export type DocumentOrFragment = Document | DocumentFragment

const isDocumentOrFragment = (
  el: DocumentOrFragment | Element,
): el is DocumentOrFragment =>
  el.nodeType === Node.DOCUMENT_NODE ||
  el.nodeType === Node.DOCUMENT_FRAGMENT_NODE

export function getTagName(el: DocumentOrFragment): undefined
export function getTagName(el: Element): string
export function getTagName(el: DocumentOrFragment | Element): string | undefined
export function getTagName(el: DocumentOrFragment | Element) {
  return 'tagName' in el ? el.tagName.toLowerCase() : undefined
}

/**
 * @see https://www.w3schools.com/tags/att_form.asp
 */
export const DISALLOWED_FORM_ATTR_TAG_NAMES =
  'button,fieldset,input,label,meter,object,output,select,textarea'.split(',')

const sanitizeAttributes = (el: Element) => {
  const tagName = getTagName(el)
  const attrs = el.attributes
  for (let i = 0, len = attrs.length; i < len; i++) {
    const attr = attrs[i]
    const { name, value } = attr
    if (name === 'is') {
      attr.value = ''
    } else if (
      name === 'autofocus' ||
      (name === 'form' && DISALLOWED_FORM_ATTR_TAG_NAMES.includes(tagName)) ||
      /^on/i.test(name) ||
      /^(?:\w+script|data):/i.test(value.replaceAll(/\r?\n/g, ''))
    ) {
      el.removeAttributeNode(attr)
      // eslint-disable-next-line sonar/updated-loop-counter -- the attribute is removed, the index and length must be rechecked
      i--
      len--
    }
  }
  return el
}

const sanitizeChildren = <T extends DocumentOrFragment | Element>(el: T) => {
  for (let i = 0, len = el.children.length; i < len; i++) {
    const item = el.children[i]
    const sanitized = sanitizeNode(item, getTagName(el))
    if (sanitized === item) {
      continue
    }
    if (sanitized == null || typeof sanitized === 'string') {
      item.replaceWith(...(sanitized == null ? [] : [sanitized]))
      // eslint-disable-next-line sonar/updated-loop-counter -- the child is removed or replaced by text, the index and length must be rechecked
      i--
      len--
    }
  }
  return el
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Authoring#using_mathml
 */
export const MathML_TAG_NAMES = new Set(
  'error,frac,i,multiscripts,n,o,over,padded,phantom,root,row,s,space,sqrt,style,sub,subsup,sup,table,td,text,tr,under,underover'
    .split(',')
    .map(it => `m${it}`),
)

function sanitizeNode(el: Document): Document
function sanitizeNode(el: DocumentFragment): DocumentFragment
function sanitizeNode(
  el: Element,
  parentTagName?: string,
): Element | string | null
function sanitizeNode(
  el: DocumentOrFragment | Element,
  parentTagName?: string,
) {
  if (isDocumentOrFragment(el)) {
    return sanitizeChildren(el)
  }

  const tagName = getTagName(el)

  if (
    (parentTagName === 'math' && !MathML_TAG_NAMES.has(tagName)) ||
    // unknown HTML element
    el instanceof HTMLUnknownElement ||
    // unknown SVG element
    Object.getPrototypeOf(el) === SVGElement.prototype
  ) {
    return el.textContent
  }

  switch (tagName) {
    case 'iframe':
    case 'link':
    case 'meta':
    case 'parsererror':
    case 'script':
    // eslint-disable-next-line no-fallthrough -- deprecated tags
    case 'noembed':
    case 'xmp': {
      el.remove()
      return
    }
    case 'template': {
      sanitizeChildren((el as HTMLTemplateElement).content)
    }
  }

  return sanitizeChildren(sanitizeAttributes(el))
}

export const TEXT_HTML = 'text/html'
export const IMAGE_SVG_XML = 'image/svg+xml'

export interface SanitizeOptions {
  type?: DOMParserSupportedType
  fragment?: boolean
}

export const sanitize = (
  domString: string,
  typeOrFragment?: DOMParserSupportedType | boolean,
) => {
  const trimmed = domString.trim()

  if (!trimmed) {
    return domString
  }

  if (!domParser) {
    domParser = new DOMParser()
  }

  const { type = TEXT_HTML, fragment }: SanitizeOptions =
    typeOrFragment == null || typeof typeOrFragment === 'string'
      ? { type: typeOrFragment }
      : { fragment: typeOrFragment }

  const doc = sanitizeNode(domParser.parseFromString(domString, type))

  return (
    (fragment && type === TEXT_HTML
      ? doc.body.innerHTML
      : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- https://github.com/microsoft/TypeScript/issues/50078
        doc.documentElement?.outerHTML) || ''
  )
}

export const sanitizeSvg = (svg: string) => sanitize(svg, IMAGE_SVG_XML)
