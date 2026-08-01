import { render, screen } from '@testing-library/react'

import { Markdown } from './markdown'

describe('Markdown', () => {
  it('renders bold text and bullet lists from a real Gemini reply', () => {
    const text = [
      'Here are 3 tips for a productive morning:',
      '',
      '* **Hydrate** immediately after waking up to boost your energy and metabolism.',
      '* **Prioritize** your top task for the day before checking emails or social media.',
      '* **Expose** yourself to natural sunlight to reset your circadian rhythm and increase alertness.',
    ].join('\n')

    render(<Markdown text={text} />)

    expect(screen.getByText('Hydrate').tagName).toBe('STRONG')
    expect(screen.getByText('Prioritize').tagName).toBe('STRONG')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument()
  })

  it('renders inline code and italics', () => {
    render(<Markdown text="Run `npm install`, then it's *ready*." />)

    expect(screen.getByText('npm install').tagName).toBe('CODE')
    expect(screen.getByText('ready').tagName).toBe('EM')
  })

  it('leaves an unclosed bold marker as literal text mid-stream', () => {
    render(<Markdown text="**Top" />)

    expect(screen.getByText('**Top')).toBeInTheDocument()
  })
})
