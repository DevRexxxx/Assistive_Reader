export interface ReaderSection {
  id: string;
  heading?: string;
  headingLevel?: 1 | 2 | 3;
  paragraphs: string[];
  illustration?: 'fixation' | 'solar' | 'architecture';
}

export interface ReaderDocument {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  sections: ReaderSection[];
}

export const SAMPLE_DOCUMENTS: ReaderDocument[] = [
  {
    id: 'reading-support',
    title: 'Customizable Reading Support for Diverse Minds',
    subtitle: 'How spacing, typography, and deterministic text cues reduce visual crowding.',
    category: 'Accessibility Guide',
    sections: [
      {
        id: 'sec-crowding',
        heading: 'Why Visual Crowding Affects Focus',
        headingLevel: 2,
        paragraphs: [
          'Dense paragraphs on bright screens force the eyes to work harder when tracking from the end of one line to the start of the next. People with dyslexia, ADHD, or sensory sensitivity often report that tightly packed lines blur together or trigger visual fatigue.',
          'Customizable reading support lets each reader adjust line height, letter spacing, background warmth, and column width as practical options to try. No single layout fits everyone, because human perception and attention vary widely.',
        ],
        illustration: 'fixation',
      },
      {
        id: 'sec-anchors',
        heading: 'Fixation Anchors, Syllables, and Letter Cues',
        headingLevel: 2,
        paragraphs: [
          'Bionic reading emphasizes the opening letters of longer words so your eyes find reliable fixation anchors while scanning across a sentence. Syllable splitting divides multi-syllable words with subtle middots or alternating colors to support phonological decoding.',
          'Some readers also find that mirrored letters such as b, d, p, and q look nearly identical at fast reading speeds. Applying distinct high-contrast tints to those confusable characters makes word shapes easier to tell apart without altering the underlying text.',
        ],
      },
      {
        id: 'sec-chunking',
        heading: 'Pacing Attention with Chunking and Timers',
        headingLevel: 2,
        paragraphs: [
          'Long articles can feel overwhelming when the entire page competes for attention at once. Switching into Sentence Focus or Chunked Cards narrows visual input down to one or two sentences at a time, while a Pomodoro rhythm pairs short focus sprints with restorative breaks.',
        ],
      },
    ],
  },
  {
    id: 'solar-system',
    title: 'Exploring Our Solar System and Orbital Motion',
    subtitle: 'A structured science passage ideal for testing Table of Contents, Media Hider, and Readability.',
    category: 'Science Essay',
    sections: [
      {
        id: 'sec-sun',
        heading: 'The Sun and Planetary Orbits',
        headingLevel: 2,
        paragraphs: [
          'At the center of our solar system sits the Sun, a yellow dwarf star containing more than ninety-nine percent of the system’s total mass. Its immense gravity keeps eight major planets, dwarf planets, and millions of asteroids moving along predictable elliptical orbits.',
          'Closer rocky planets—Mercury, Venus, Earth, and Mars—complete their orbits quickly under intense solar radiation. Further outward, gas and ice giants travel much wider paths through cold space.',
        ],
        illustration: 'solar',
      },
      {
        id: 'sec-atmosphere',
        heading: 'Atmospheres and Surface Contrast',
        headingLevel: 2,
        paragraphs: [
          'Earth maintains liquid water largely because its atmosphere regulates surface temperature and shields life from harsh ultraviolet radiation. By contrast, Mars has a thin carbon dioxide atmosphere that allows temperatures to swing sharply between day and night.',
        ],
      },
      {
        id: 'sec-telescopes',
        heading: 'Observing Distant Worlds',
        headingLevel: 2,
        paragraphs: [
          'Modern space telescopes capture faint infrared and visible wavelengths that ground observatories cannot easily resolve. Every spectrum recorded by a telescope reveals chemical clues about distant planetary atmospheres and galaxy formation.',
        ],
      },
    ],
  },
  {
    id: 'local-first',
    title: 'Deterministic Local-First Accessibility Architecture',
    subtitle: 'Why privacy-first reading tools run entirely on your device with zero cloud AI.',
    category: 'Technical Brief',
    sections: [
      {
        id: 'sec-privacy',
        heading: 'Zero Telemetry and Offline Resilience',
        headingLevel: 2,
        paragraphs: [
          'Reading habits and accessibility preferences reveal deeply personal cognitive and sensory traits. Keeping every algorithm—from Liang-style hyphenation to TextRank extractive highlights—inside a local core ensures no document text or usage telemetry ever leaves your device.',
          'Because fonts, dictionaries, and cryptographic Ed25519 signature checks are bundled locally, every feature keeps working in airplane mode or behind strict institutional firewalls.',
        ],
        illustration: 'architecture',
      },
      {
        id: 'sec-adapters',
        heading: 'Pure Core Logic Behind Platform Adapters',
        headingLevel: 2,
        paragraphs: [
          'Separating pure TypeScript algorithms from browser DOM and storage adapters gives the architecture high resilience. A timestamp-driven Pomodoro state machine, for example, derives remaining seconds from a target timestamp rather than fragile interval counters.',
          'When speech synthesis runs, inspecting the localService flag on available voices verifies whether audio is rendered strictly on-device or routed to a network service, giving the user transparent control over privacy and latency.',
        ],
      },
    ],
  },
];

export function documentToBodyText(doc: ReaderDocument): string {
  const parts: string[] = [];
  for (const s of doc.sections) {
    parts.push(...s.paragraphs);
  }
  return parts.join('\n\n');
}

export function documentToPlainText(doc: ReaderDocument): string {
  const parts: string[] = [doc.title];
  if (doc.subtitle) parts.push(doc.subtitle);
  for (const s of doc.sections) {
    if (s.heading) parts.push(s.heading);
    parts.push(...s.paragraphs);
  }
  return parts.join('\n\n');
}

export function parseRawTextToDocument(title: string, rawText: string): ReaderDocument {
  const cleaned = rawText.replace(/\r\n/g, '\n').trim();
  const blocks = cleaned.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);

  const sections: ReaderSection[] = [];
  let currentSection: ReaderSection = {
    id: 'sec-0',
    paragraphs: [],
  };

  for (const block of blocks) {
    const mdHeadingMatch = block.match(/^(#{1,3})\s+(.+)$/);
    if (mdHeadingMatch) {
      if (currentSection.paragraphs.length > 0 || currentSection.heading) {
        sections.push(currentSection);
      }
      const level = Math.min(3, mdHeadingMatch[1].length) as 1 | 2 | 3;
      currentSection = {
        id: `sec-${sections.length + 1}`,
        heading: mdHeadingMatch[2].trim(),
        headingLevel: level,
        paragraphs: [],
      };
    } else {
      currentSection.paragraphs.push(block.replace(/\n+/g, ' '));
    }
  }

  if (currentSection.paragraphs.length > 0 || currentSection.heading) {
    sections.push(currentSection);
  }

  if (sections.length === 0) {
    sections.push({
      id: 'sec-empty',
      paragraphs: ['Paste or upload any text, Markdown, or HTML file to start reading with customizable support.'],
    });
  }

  return {
    id: `custom-doc-${Date.now().toString(36)}`,
    title: title.trim() || 'Custom Reading Passage',
    subtitle: 'Imported locally — never uploaded to any server.',
    category: 'Custom Text',
    sections,
  };
}
