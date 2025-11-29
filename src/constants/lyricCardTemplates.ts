export interface LyricCardTemplate {
  display: string
  template: string
  blank_count: number
}

// Lightweight starter deck for server-dealt hands; extend as needed.
export const LYRIC_CARD_TEMPLATES: LyricCardTemplate[] = [
  {
    display: 'My ____ left me for ____',
    template: 'My {0} left me for {1}',
    blank_count: 2,
  },
  {
    display: "I'm addicted to ____",
    template: "I'm addicted to {0}",
    blank_count: 1,
  },
  {
    display: 'Last night I saw ____',
    template: 'Last night I saw {0}',
    blank_count: 1,
  },
  {
    display: 'Goodbye to ____',
    template: 'Goodbye to {0}',
    blank_count: 1,
  },
  {
    display: 'Dancing with ____',
    template: 'Dancing with {0}',
    blank_count: 1,
  },
  {
    display: 'My therapist said ____',
    template: 'My therapist said {0}',
    blank_count: 1,
  },
  {
    display: 'I wrote this for ____',
    template: 'I wrote this for {0}',
    blank_count: 1,
  },
  {
    display: 'A love song for ____',
    template: 'A love song for {0}',
    blank_count: 1,
  },
  {
    display: 'Confessions about ____',
    template: 'Confessions about {0}',
    blank_count: 1,
  },
  {
    display: 'This chorus is just ____',
    template: 'This chorus is just {0}',
    blank_count: 1,
  },
]
