import { render, screen } from '@testing-library/react'

import { App } from './App'

describe('App', () => {
  it('renders the Morning Pulse starter', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /your day starts here/i }),
    ).toBeInTheDocument()
  })
})
