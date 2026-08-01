import type { ReactNode } from 'react'

type Block =
  | { type: 'p'; lines: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; lines: string[] }

const LIST_ITEM = /^[-*]\s+/
const ORDERED_ITEM = /^\d+\.\s+/
const FENCE = /^```/

function parseBlocks(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''

    if (line.trim() === '') {
      i++
      continue
    }

    if (FENCE.test(line)) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !FENCE.test(lines[i] ?? '')) {
        codeLines.push(lines[i] ?? '')
        i++
      }
      i++
      blocks.push({ type: 'code', lines: codeLines })
      continue
    }

    if (LIST_ITEM.test(line)) {
      const items: string[] = []
      while (i < lines.length && LIST_ITEM.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(LIST_ITEM, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    if (ORDERED_ITEM.test(line)) {
      const items: string[] = []
      while (i < lines.length && ORDERED_ITEM.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(ORDERED_ITEM, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    const paraLines: string[] = []
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() !== '' &&
      !FENCE.test(lines[i] ?? '') &&
      !LIST_ITEM.test(lines[i] ?? '') &&
      !ORDERED_ITEM.test(lines[i] ?? '')
    ) {
      paraLines.push(lines[i] ?? '')
      i++
    }
    blocks.push({ type: 'p', lines: paraLines })
  }

  return blocks
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g

function renderInline(text: string, key: string): ReactNode[] {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((part, index) => {
      const partKey = `${key}-${index}`
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partKey}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={partKey}
            className="rounded bg-ink/10 px-1 py-0.5 text-[0.85em]"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      if (
        (part.startsWith('*') && part.endsWith('*')) ||
        (part.startsWith('_') && part.endsWith('_'))
      ) {
        return <em key={partKey}>{part.slice(1, -1)}</em>
      }
      return part
    })
}

export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text)
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        const key = `block-${index}`
        if (block.type === 'code') {
          return (
            <pre
              key={key}
              className="overflow-x-auto rounded-xl bg-ink/10 p-2.5 text-xs"
            >
              <code>{block.lines.join('\n')}</code>
            </pre>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={key} className="list-disc space-y-1 pl-4">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {renderInline(item, `${key}-${itemIndex}`)}
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'ol') {
          return (
            <ol key={key} className="list-decimal space-y-1 pl-4">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {renderInline(item, `${key}-${itemIndex}`)}
                </li>
              ))}
            </ol>
          )
        }
        return <p key={key}>{renderInline(block.lines.join(' '), key)}</p>
      })}
    </div>
  )
}
