export const quotes = [
  {
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
  },
  {
    text: 'Great things are done by a series of small things brought together.',
    author: 'Vincent van Gogh',
  },
  { text: 'Nothing will work unless you do.', author: 'Maya Angelou' },
  {
    text: 'The future depends on what you do today.',
    author: 'Mahatma Gandhi',
  },
  {
    text: 'A year from now you may wish you had started today.',
    author: 'Karen Lamb',
  },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'Well begun is half done.', author: 'Aristotle' },
]

export const developerTips = [
  {
    title: 'Start with intent',
    text: 'Write the expected outcome before opening the implementation.',
  },
  {
    title: 'Shrink the feedback loop',
    text: 'Run the narrowest useful test while changing behavior.',
  },
  {
    title: 'Name the trade-off',
    text: 'Document why a choice was made, not what the code already says.',
  },
  {
    title: 'Read the failure',
    text: 'Treat errors as evidence before changing code.',
  },
  {
    title: 'Keep boundaries typed',
    text: 'Validate external data once, then trust your internal model.',
  },
  {
    title: 'Delete uncertainty',
    text: 'Replace a clever abstraction with clear code when it has only one caller.',
  },
  {
    title: 'Finish calmly',
    text: 'Review the diff as if it was written by someone else.',
  },
]

export function dailyItem<T>(items: readonly T[], now = new Date()): T {
  const day = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000,
  )
  return items[day % items.length]!
}
