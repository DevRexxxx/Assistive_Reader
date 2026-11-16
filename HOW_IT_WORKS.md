# How Each Feature Works (Privacy Reviewer Summary)

Every feature in AssistiveReader runs 100% locally in the browser or extension with zero network requests and zero generative AI.

| Feature | Inputs | Deterministic Algorithm | Outputs | Data Leaving Device |
|---|---|---|---|---|
| **Built-in & Calibrated Profiles** | User selection or 4-step comparison choices | Rule-based mapping (`buildCalibratedProfile`) + JSON schema validation | Declarative `Profile` object applied to typography/layout | None |
| **Bionic Reading** | Text tokens | Splits punctuation, bolds `ceil(len * 0.4)` leading chars for words >= 3 chars | Bold/normal text segments | None |
| **Syllable Splitting** | Words (English default) | Liang-style hyphenation pattern scoring + exception lexicon + vowel guard | Syllable arrays rendered with `·` or alternating colors | None |
| **Confusable Letters** | Text + target chars (`bdpq`) | Exact character-by-character scan | High-contrast color spans | None |
| **Sentence Focus & Chunk Cards** | Passage text | Rule-based sentence splitter with abbreviation & decimal guards | Ordered sentences / 2-sentence cards | None |
| **Readability Indicator** | Passage text | Word, sentence, and syllable counts fed into Flesch-Kincaid, Gunning Fog & SMOG | Grade level & non-judgmental band | None |
| **Key Sentences (Extractive)** | Passage text | Stop-word filtering + Jaccard similarity graph (TextRank) + TF density | Top 3 existing sentences in reading order | None |
| **Offline Dictionary** | Clicked word | Local lookup in bundled lexicon + suffix stemmer | POS, IPA pronunciation, definition | None |
| **Read Aloud (TTS)** | Text & sentences | Browser `window.speechSynthesis`, inspects `voice.localService === true` | Spoken audio + warning if only network voices exist | None (warns if OS/browser voice is remote) |
| **Pomodoro Timer** | Start/Pause timestamps | Derives `ceil((targetEndTimestamp - now) / 1000)` | Countdown & session transitions | None |
| **Offline Licensing** | `AR1.<payload>.<sig>` string | Pure-TS RFC 8032 Ed25519 verification against embedded public key | Tier unlock (`free`/`pro`/`family`/`education`) | None |
