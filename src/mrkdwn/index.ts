import { visit } from 'unist-util-visit'
import { JSXSlack } from '../jsx'
import {
  hastUtilToMdast as hast2mdast,
  hastUtilToMdastAll as all,
  hastUtilToMdastListItem as listItem,
  hastUtilToMdastRoot as root,
  hastUtilToMdastTextarea as toTextNode,
} from '../prebundles/hastUtilToMdast'
import { decodeEntity } from './escape'
import { parseJSX } from './jsx'
import parser from './parser'
import stringifier from './stringifier'

const list = (h, node) => {
  const ordered = node.tagName === 'ol'
  const orderedType = ordered ? node.properties.type ?? '1' : null
  const start = ordered ? Number.parseInt(node.properties.start ?? 1, 10) : null

  // Mark implied list item
  const children = h.handlers.span(h, node).map((item) => {
    if (item.type !== 'listItem')
      return { type: 'listItem', data: { implied: true }, children: [item] }

    return item
  })

  return h(node, 'list', { ordered, orderedType, start }, children)
}

const htmlToMrkdwn = (html: string) =>
  stringifier(
    hast2mdast(parser(html), {
      document: false,
      handlers: {
        root: (h, node) => {
          visit(node, (n) => {
            if (n.type === 'text') n.value = decodeEntity(n.value)
          })
          return root(h, node)
        },
        code: (h, node) =>
          h.augment(node, {
            type: 'inlineCode',
            children: h.handlers.span(h, node),
          }),
        pre: (h, node) =>
          h.augment(node, {
            // Render as inline code to prevent making implied paragraphs
            type: 'inlineCode',
            children: h.handlers.span(h, node),
            data: { codeBlock: true },
          }),
        time: (h, node) => ({
          ...toTextNode(h, node),
          data: {
            time: {
              datetime: node.properties.datetime,
              fallback: node.properties['data-fallback'],
            },
          },
        }),
        ul: list,
        ol: list,
        li: (h, node) => {
          const elm = listItem(h, node)
          const value = Number.parseInt(node.properties.value, 10)

          if (!Number.isNaN(value)) elm.data = { value }

          return elm
        },
        span: (h, node) => {
          if (node.properties['data-escape']) {
            return {
              ...toTextNode(h, node),
              data: { escape: node.properties['data-escape'] },
            }
          }
          return all(h, node)
        },
      },
    })
  )

export const mrkdwn = (children: JSXSlack.ChildElements) =>
  htmlToMrkdwn(parseJSX(children, []).join(''))
