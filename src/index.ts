let domParser: DOMParser | undefined

export type DocumentOrFragment = Document | DocumentFragment

const isDocumentOrFragment = (
  el: ChildNode | DocumentOrFragment,
): el is DocumentOrFragment =>
  el.nodeType === el.DOCUMENT_NODE || el.nodeType === el.DOCUMENT_FRAGMENT_NODE

const isElement = (el: ChildNode | DocumentOrFragment): el is Element =>
  el.nodeType === el.ELEMENT_NODE

const isComment = (el: ChildNode): el is Comment =>
  el.nodeType === el.COMMENT_NODE

function getTagName(el: Element): string
function getTagName(el: ChildNode | DocumentOrFragment): string | undefined
function getTagName(el: ChildNode | DocumentOrFragment) {
  return isElement(el) ? el.tagName.toLowerCase() : undefined
}

/**
 * @see https://www.w3schools.com/tags/att_form.asp
 */
const DISALLOWED_FORM_ATTR_TAG_NAMES =
  'button,fieldset,input,label,meter,object,output,select,textarea'.split(',')

const DISALLOWED_ATTR_NAMES = 'autofocus,datafld,dataformatas,datasrc'.split(
  ',',
)

const sanitizeAttributes = (el: Element) => {
  const tagName = getTagName(el)
  const attrs = el.attributes
  for (let i = 0, len = attrs.length; i < len; i++) {
    const attr = attrs[i]
    const { name, value } = attr
    if (name === 'is') {
      attr.value = ''
    } else if (
      DISALLOWED_ATTR_NAMES.includes(name) ||
      (name === 'form' && DISALLOWED_FORM_ATTR_TAG_NAMES.includes(tagName)) ||
      /^(?:["'<=>`]|on)/i.test(name) ||
      /\s/.test(name) ||
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

const sanitizeChildren = <T extends ChildNode | DocumentOrFragment>(el: T) => {
  for (let i = 0, len = el.childNodes.length; i < len; i++) {
    const item = el.childNodes[i]
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
const MathML_TAG_NAMES =
  'error,frac,i,multiscripts,n,o,over,padded,phantom,root,row,s,space,sqrt,style,sub,subsup,sup,table,td,text,tr,under,underover'
    .split(',')
    .map(it => `m${it}`)

const DANGEROUS_OR_OBSOLETE_TAG_NAMES = 'event-source,listing'.split(',')

function sanitizeNode(el: Document): Document
function sanitizeNode(el: DocumentFragment): DocumentFragment
function sanitizeNode(
  el: ChildNode,
  parentTagName?: string,
): ChildNode | string | null | undefined
function sanitizeNode(
  el: ChildNode | DocumentOrFragment,
  parentTagName?: string,
) {
  if (isDocumentOrFragment(el)) {
    return sanitizeChildren(el)
  }

  if (isComment(el)) {
    return
  }

  if (!isElement(el)) {
    return el
  }

  const tagName = getTagName(el)

  if (
    (parentTagName === 'math' && !MathML_TAG_NAMES.includes(tagName)) ||
    DANGEROUS_OR_OBSOLETE_TAG_NAMES.includes(tagName) ||
    // unknown HTML element
    el instanceof HTMLUnknownElement ||
    // unknown SVG element
    (Object.getPrototypeOf(el) === SVGElement.prototype &&
      // https://github.com/jsdom/jsdom/issues/2734
      !['defs', 'filter', 'g', 'script'].includes(tagName))
  ) {
    return el.textContent
  }

  switch (tagName) {
    case 'style': {
      const { sheet } = el as HTMLStyleElement
      if (sheet?.ownerRule || sheet?.cssRules.length) {
        break
      }
    }
    // eslint-disable-next-line no-fallthrough -- intended to remove empty style element
    case 'embed':
    case 'iframe':
    case 'link':
    case 'meta':
    case 'object':
    case 'parsererror':
    case 'script':
    // eslint-disable-next-line no-fallthrough -- deprecated tags
    case 'noembed':
    case 'xmp': {
      return el.remove()
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

  const doc = sanitizeNode(
    domParser.parseFromString(
      // make sure the string is wrapped in a body tag
      fragment ? `<body>${domString}` : domString,
      type,
    ),
  )

  return fragment && type === TEXT_HTML
    ? doc.body.innerHTML
    : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- https://github.com/microsoft/TypeScript/issues/50078
      doc.documentElement?.outerHTML || ''
}

export const sanitizeSvg = (svg: string) => sanitize(svg, IMAGE_SVG_XML)
