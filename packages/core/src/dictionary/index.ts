/**
 * Bundled Offline Dictionary (WordNet-inspired public-domain core entries)
 * Pure TypeScript — zero network, deterministic stemmer fallback.
 */

export interface DictionaryEntry {
  word: string;
  pos: string;
  pronunciation: string;
  definition: string;
  example?: string;
}

const ENTRIES: DictionaryEntry[] = [
  { word: 'accessibility', pos: 'noun', pronunciation: '/əkˌses.əˈbɪl.ə.ti/', definition: 'The quality of being usable and understandable by people with diverse abilities and sensory needs.' },
  { word: 'adaptive', pos: 'adjective', pronunciation: '/əˈdæp.tɪv/', definition: 'Able to adjust or change in response to different conditions or individual preferences.' },
  { word: 'algorithm', pos: 'noun', pronunciation: '/ˈæl.ɡə.rɪð.əm/', definition: 'A step-by-step set of deterministic rules used to perform a calculation or solve a problem.' },
  { word: 'anchor', pos: 'noun', pronunciation: '/ˈæŋ.kər/', definition: 'A visual or mental reference point that keeps attention steady while scanning text.' },
  { word: 'annotation', pos: 'noun', pronunciation: '/ˌæn.əˈteɪ.ʃən/', definition: 'A short note or visual marker added to explain or highlight part of a text.' },
  { word: 'anxiety', pos: 'noun', pronunciation: '/æŋˈzaɪ.ə.ti/', definition: 'A feeling of worry, tension, or unease, especially when facing overload or uncertainty.' },
  { word: 'articulate', pos: 'verb', pronunciation: '/ɑːrˈtɪk.jə.leɪt/', definition: 'To express an idea clearly and distinctly in speech or writing.' },
  { word: 'attention', pos: 'noun', pronunciation: '/əˈten.ʃən/', definition: 'The mental focus directed toward a specific task, idea, or sensory input.' },
  { word: 'auditory', pos: 'adjective', pronunciation: '/ˈɔː.də.tɔːr.i/', definition: 'Relating to the sense of hearing or spoken sound.' },
  { word: 'autism', pos: 'noun', pronunciation: '/ˈɔː.tɪ.zəm/', definition: 'A natural neurodevelopmental variation characterized by distinct patterns of communication, focus, and sensory processing.' },
  { word: 'baseline', pos: 'noun', pronunciation: '/ˈbeɪs.laɪn/', definition: 'A starting reference point used for comparing later measurements or preferences.' },
  { word: 'bionic', pos: 'adjective', pronunciation: '/baɪˈɒn.ɪk/', definition: 'In typography, styling word beginnings in bold to create artificial fixation points for reading.' },
  { word: 'brevity', pos: 'noun', pronunciation: '/ˈbrev.ə.ti/', definition: 'Concise and clear expression using few words.' },
  { word: 'calibration', pos: 'noun', pronunciation: '/ˌkæl.əˈbreɪ.ʃən/', definition: 'The process of adjusting settings to match an individual user’s comfort and perception.' },
  { word: 'chunking', pos: 'noun', pronunciation: '/ˈtʃʌŋ.kɪŋ/', definition: 'Breaking long passages into small, manageable units so working memory is not overloaded.' },
  { word: 'clarity', pos: 'noun', pronunciation: '/ˈklær.ə.ti/', definition: 'The quality of being easy to see, read, or understand without ambiguity.' },
  { word: 'cognition', pos: 'noun', pronunciation: '/kɒɡˈnɪʃ.ən/', definition: 'The mental processes involved in acquiring knowledge, reading, memory, and understanding.' },
  { word: 'cognitive', pos: 'adjective', pronunciation: '/ˈkɒɡ.nə.tɪv/', definition: 'Related to thinking, attention, memory, and information processing.' },
  { word: 'coherence', pos: 'noun', pronunciation: '/koʊˈhɪər.əns/', definition: 'Logical and consistent connection across ideas in a passage.' },
  { word: 'comprehension', pos: 'noun', pronunciation: '/ˌkɒm.prɪˈhen.ʃən/', definition: 'The ability to grasp the meaning and structure of written or spoken language.' },
  { word: 'concentration', pos: 'noun', pronunciation: '/ˌkɒn.sənˈtreɪ.ʃən/', definition: 'Sustained mental effort directed toward a single subject or activity.' },
  { word: 'confusable', pos: 'adjective', pronunciation: '/kənˈfjuː.zə.bəl/', definition: 'Easily mistaken for another letter or symbol with a mirrored or similar shape, such as b, d, p, and q.' },
  { word: 'consistency', pos: 'noun', pronunciation: '/kənˈsɪs.tən.si/', definition: 'Keeping layout, typography, and controls predictable across screens and sessions.' },
  { word: 'context', pos: 'noun', pronunciation: '/ˈkɒn.tekst/', definition: 'The surrounding words, sentences, or situation that clarify the meaning of a passage.' },
  { word: 'contrast', pos: 'noun', pronunciation: '/ˈkɒn.trɑːst/', definition: 'The difference in brightness or color between text and its background.' },
  { word: 'criterion', pos: 'noun', pronunciation: '/kraɪˈtɪər.i.ən/', definition: 'A standard or rule by which something is evaluated or chosen.' },
  { word: 'crowding', pos: 'noun', pronunciation: '/ˈkraʊ.dɪŋ/', definition: 'Visual interference that occurs when letters or lines are spaced too closely together.' },
  { word: 'decode', pos: 'verb', pronunciation: '/diːˈkoʊd/', definition: 'To translate written letters and syllables into recognizable words and sounds.' },
  { word: 'deficiency', pos: 'noun', pronunciation: '/dɪˈfɪʃ.ən.si/', definition: 'A reduced ability or shortage, such as reduced sensitivity to certain color wavelengths.' },
  { word: 'deterministic', pos: 'adjective', pronunciation: '/dɪˌtɜːr.mɪˈnɪs.tɪk/', definition: 'Producing the exact same predictable output every time for a given input, with no randomness.' },
  { word: 'deuteranopia', pos: 'noun', pronunciation: '/ˌdjuː.tə.rəˈnoʊ.pi.ə/', definition: 'A form of red-green color vision deficiency involving reduced green cone sensitivity.' },
  { word: 'distraction', pos: 'noun', pronunciation: '/dɪˈstræk.ʃən/', definition: 'Anything—such as popups, ads, or motion—that pulls attention away from reading.' },
  { word: 'diverse', pos: 'adjective', pronunciation: '/daɪˈvɜːrs/', definition: 'Showing variety across people, perspectives, or ways of processing information.' },
  { word: 'document', pos: 'noun', pronunciation: '/ˈdɒk.jə.mənt/', definition: 'A piece of written, printed, or digital text kept for reading or reference.' },
  { word: 'duration', pos: 'noun', pronunciation: '/djʊˈreɪ.ʃən/', definition: 'The length of time that an activity, timer interval, or session continues.' },
  { word: 'dyslexia', pos: 'noun', pronunciation: '/dɪsˈlek.si.ə/', definition: 'A common learning difference affecting phonological decoding, word recognition, and visual tracking.' },
  { word: 'emphasis', pos: 'noun', pronunciation: '/ˈem.fə.sɪs/', definition: 'Special visual or spoken weight placed on a word, letter, or sentence.' },
  { word: 'empirical', pos: 'adjective', pronunciation: '/ɪmˈpɪr.ɪ.kəl/', definition: 'Based on direct observation and testing rather than theory alone.' },
  { word: 'encryption', pos: 'noun', pronunciation: '/ɪnˈkrɪp.ʃən/', definition: 'Encoding data so only authorized keys can read it.' },
  { word: 'ergonomic', pos: 'adjective', pronunciation: '/ˌɜːr.ɡəˈnɒm.ɪk/', definition: 'Designed to reduce physical or visual strain during sustained use.' },
  { word: 'evidence', pos: 'noun', pronunciation: '/ˈev.ɪ.dəns/', definition: 'Facts or observations that indicate whether a method works as intended.' },
  { word: 'executive', pos: 'adjective', pronunciation: '/ɪɡˈzek.jə.tɪv/', definition: 'Relating to cognitive skills for planning, starting tasks, and managing attention.' },
  { word: 'extractive', pos: 'adjective', pronunciation: '/ɪkˈstræk.tɪv/', definition: 'Selecting exact sentences directly from the source text rather than generating new text.' },
  { word: 'fatigue', pos: 'noun', pronunciation: '/fəˈtiːɡ/', definition: 'Mental or visual tiredness resulting from prolonged concentration or glare.' },
  { word: 'filter', pos: 'noun', pronunciation: '/ˈfɪl.tər/', definition: 'A mathematical or visual adjustment applied to colors, contrast, or content.' },
  { word: 'fixation', pos: 'noun', pronunciation: '/fɪkˈseɪ.ʃən/', definition: 'The brief moment when the eyes pause on a word while reading.' },
  { word: 'fluency', pos: 'noun', pronunciation: '/ˈfluː.ən.si/', definition: 'The ability to read smoothly, accurately, and with comfortable pacing.' },
  { word: 'focus', pos: 'noun', pronunciation: '/ˈfoʊ.kəs/', definition: 'Concentrated attention on a single line, sentence, or task.' },
  { word: 'format', pos: 'noun', pronunciation: '/ˈfɔːr.mæt/', definition: 'The visual arrangement, font, and layout of text on a page.' },
  { word: 'friction', pos: 'noun', pronunciation: '/ˈfrɪk.ʃən/', definition: 'Unnecessary effort or obstacles that slow down completing a task.' },
  { word: 'glare', pos: 'noun', pronunciation: '/ɡleər/', definition: 'Harsh brightness from a screen that can cause visual discomfort.' },
  { word: 'grapheme', pos: 'noun', pronunciation: '/ˈɡræf.iːm/', definition: 'The smallest written unit of a writing system, such as a single letter or letter pair.' },
  { word: 'heuristic', pos: 'noun', pronunciation: '/hjʊəˈrɪs.tɪk/', definition: 'A practical rule-of-thumb method used to extract structure or estimate a result quickly.' },
  { word: 'hierarchy', pos: 'noun', pronunciation: '/ˈhaɪə.rɑːr.ki/', definition: 'A clear ranking of headings and sections showing how ideas are organized.' },
  { word: 'highlight', pos: 'verb', pronunciation: '/ˈhaɪ.laɪt/', definition: 'To mark words or sentences visually so they stand out during reading.' },
  { word: 'hyphenation', pos: 'noun', pronunciation: '/ˌhaɪ.fəˈneɪ.ʃən/', definition: 'Dividing words at valid syllable boundaries.' },
  { word: 'inference', pos: 'noun', pronunciation: '/ˈɪn.fər.əns/', definition: 'A conclusion reached from clues and facts present in a text.' },
  { word: 'interval', pos: 'noun', pronunciation: '/ˈɪn.tər.vəl/', definition: 'A measured block of time between focus periods and breaks.' },
  { word: 'kerning', pos: 'noun', pronunciation: '/ˈkɜːr.nɪŋ/', definition: 'The horizontal spacing adjusted between pairs of letters.' },
  { word: 'legibility', pos: 'noun', pronunciation: '/ˌledʒ.əˈbɪl.ə.ti/', definition: 'How easily individual letters and words can be distinguished from one another.' },
  { word: 'lexicon', pos: 'noun', pronunciation: '/ˈlek.sɪ.kɒn/', definition: 'The complete set of words stored in a dictionary or vocabulary.' },
  { word: 'luminance', pos: 'noun', pronunciation: '/ˈluː.mɪ.nəns/', definition: 'The perceived brightness emitted by a surface or display.' },
  { word: 'matrix', pos: 'noun', pronunciation: '/ˈmeɪ.trɪks/', definition: 'A rectangular grid of numbers used to transform RGB color channels.' },
  { word: 'memory', pos: 'noun', pronunciation: '/ˈmem.ər.i/', definition: 'The cognitive system that holds and retrieves information while reading.' },
  { word: 'metric', pos: 'noun', pronunciation: '/ˈmet.rɪk/', definition: 'A quantifiable measurement such as reading ease or words per sentence.' },
  { word: 'modulation', pos: 'noun', pronunciation: '/ˌmɒdʒ.əˈleɪ.ʃən/', definition: 'Controlled adjustment of intensity, contrast, or speech cadence.' },
  { word: 'monochrome', pos: 'adjective', pronunciation: '/ˈmɒn.ə.kroʊm/', definition: 'Displayed in shades of a single color or grayscale.' },
  { word: 'morphology', pos: 'noun', pronunciation: '/mɔːrˈfɒl.ə.dʒi/', definition: 'The structure of words formed from roots, prefixes, and suffixes.' },
  { word: 'navigation', pos: 'noun', pronunciation: '/ˌnæv.ɪˈɡeɪ.ʃən/', definition: 'Moving cleanly between sections, headings, or cards in a document.' },
  { word: 'neurodivergent', pos: 'adjective', pronunciation: '/ˌnjʊə.roʊ.daɪˈvɜːr.dʒənt/', definition: 'Having brain functioning or cognitive traits that differ from dominant societal norms, including ADHD, autism, and dyslexia.' },
  { word: 'neurotype', pos: 'noun', pronunciation: '/ˈnjʊə.roʊ.taɪp/', definition: 'A characteristic pattern of neurological processing and sensory preferences.' },
  { word: 'offline', pos: 'adjective', pronunciation: '/ˌɒfˈlaɪn/', definition: 'Operating completely on the local device without an internet connection.' },
  { word: 'opacity', pos: 'noun', pronunciation: '/oʊˈpæs.ə.ti/', definition: 'How solid or transparent an element appears.' },
  { word: 'overload', pos: 'noun', pronunciation: '/ˌoʊ.vərˈloʊd/', definition: 'A state where sensory or cognitive input exceeds comfortable processing capacity.' },
  { word: 'overlay', pos: 'noun', pronunciation: '/ˈoʊ.vər.leɪ/', definition: 'A gentle translucent color tint placed over text to reduce harsh white glare.' },
  { word: 'pacing', pos: 'noun', pronunciation: '/ˈpeɪ.sɪŋ/', definition: 'Controlling the speed at which text or speech is presented.' },
  { word: 'paragraph', pos: 'noun', pronunciation: '/ˈpær.ə.ɡrɑːf/', definition: 'A distinct section of writing focused on a single point or idea.' },
  { word: 'pattern', pos: 'noun', pronunciation: '/ˈpæt.ərn/', definition: 'A recurring structure or rule used to split syllables or recognize sentences.' },
  { word: 'perception', pos: 'noun', pronunciation: '/pərˈsep.ʃən/', definition: 'The way sensory information—such as color, contrast, and layout—is interpreted.' },
  { word: 'phoneme', pos: 'noun', pronunciation: '/ˈfoʊ.niːm/', definition: 'A distinct unit of sound that distinguishes one word from another.' },
  { word: 'phonetic', pos: 'adjective', pronunciation: '/fəˈnet.ɪk/', definition: 'Relating to how words sound when spoken aloud.' },
  { word: 'phonology', pos: 'noun', pronunciation: '/fəˈnɒl.ə.dʒi/', definition: 'The system of speech sounds in a language.' },
  { word: 'pomodoro', pos: 'noun', pronunciation: '/ˌpɒm.əˈdɔːr.oʊ/', definition: 'A time-management rhythm alternating focused work intervals with short restorative breaks.' },
  { word: 'predictable', pos: 'adjective', pronunciation: '/prɪˈdɪk.tə.bəl/', definition: 'Behaving consistently without sudden layout shifts or unexpected motion.' },
  { word: 'preference', pos: 'noun', pronunciation: '/ˈpref.ər.əns/', definition: 'A chosen setting that feels most comfortable for an individual reader.' },
  { word: 'privacy', pos: 'noun', pronunciation: '/ˈprɪv.ə.si/', definition: 'Keeping personal reading habits, preferences, and documents strictly on your own device.' },
  { word: 'profile', pos: 'noun', pronunciation: '/ˈproʊ.faɪl/', definition: 'A saved collection of typography, color, spacing, and focus settings.' },
  { word: 'protanopia', pos: 'noun', pronunciation: '/ˌproʊ.təˈnoʊ.pi.ə/', definition: 'A form of red-green color vision deficiency involving reduced red cone sensitivity.' },
  { word: 'readability', pos: 'noun', pronunciation: '/ˌriː.dəˈbɪl.ə.ti/', definition: 'How easily a passage can be read based on sentence length and word complexity.' },
  { word: 'reading', pos: 'noun', pronunciation: '/ˈriː.dɪŋ/', definition: 'The process of interpreting written symbols to construct meaning.' },
  { word: 'retention', pos: 'noun', pronunciation: '/rɪˈten.ʃən/', definition: 'Remembering what has been read after finishing a section.' },
  { word: 'rhythm', pos: 'noun', pronunciation: '/ˈrɪð.əm/', definition: 'A steady, comfortable tempo for reading or alternating focus and rest.' },
  { word: 'ruler', pos: 'noun', pronunciation: '/ˈruː.lər/', definition: 'A horizontal focus band that highlights the active lines and dims surrounding text.' },
  { word: 'saccade', pos: 'noun', pronunciation: '/sæˈkɑːd/', definition: 'A rapid jump of the eye from one fixation point to the next while reading.' },
  { word: 'saturation', pos: 'noun', pronunciation: '/ˌsætʃ.əˈreɪ.ʃən/', definition: 'The intensity or vividness of colors on screen.' },
  { word: 'scanning', pos: 'noun', pronunciation: '/ˈskæn.ɪŋ/', definition: 'Moving the eyes across text to locate specific words or headings.' },
  { word: 'sensory', pos: 'adjective', pronunciation: '/ˈsen.sər.i/', definition: 'Relating to visual, auditory, or motion stimuli experienced by the senses.' },
  { word: 'sentence', pos: 'noun', pronunciation: '/ˈsen.təns/', definition: 'A complete grammatical unit of words expressing a statement, question, or idea.' },
  { word: 'signature', pos: 'noun', pronunciation: '/ˈsɪɡ.nə.tʃər/', definition: 'A cryptographic proof verifying that a license key is authentic without contacting a server.' },
  { word: 'spacing', pos: 'noun', pronunciation: '/ˈspeɪ.sɪŋ/', definition: 'The distance between letters, words, and lines of text.' },
  { word: 'spectrum', pos: 'noun', pronunciation: '/ˈspek.trəm/', definition: 'The continuous range of colors or neurocognitive traits.' },
  { word: 'stimulus', pos: 'noun', pronunciation: '/ˈstɪm.jə.ləs/', definition: 'An external visual or auditory signal that triggers attention or reaction.' },
  { word: 'streak', pos: 'noun', pronunciation: '/striːk/', definition: 'Consecutive days on which a reader meets their chosen focus target.' },
  { word: 'structure', pos: 'noun', pronunciation: '/ˈstrʌk.tʃər/', definition: 'The outline of headings, paragraphs, and lists that organize a document.' },
  { word: 'syllable', pos: 'noun', pronunciation: '/ˈsɪl.ə.bəl/', definition: 'A single unit of spoken pronunciation containing one vowel sound.' },
  { word: 'synthesis', pos: 'noun', pronunciation: '/ˈsɪn.θə.sɪs/', definition: 'Generating spoken audio locally from written text using on-device voices.' },
  { word: 'telemetry', pos: 'noun', pronunciation: '/təˈlem.ə.tri/', definition: 'Automated transmission of usage data to remote servers—explicitly excluded from AssistiveReader.' },
  { word: 'threshold', pos: 'noun', pronunciation: '/ˈθreʃ.hoʊld/', definition: 'The boundary point at which a setting or target takes effect.' },
  { word: 'tracking', pos: 'noun', pronunciation: '/ˈtræk.ɪŋ/', definition: 'Keeping the eyes aligned on the correct line of text from left to right.' },
  { word: 'tritanopia', pos: 'noun', pronunciation: '/ˌtraɪ.təˈnoʊ.pi.ə/', definition: 'A form of blue-yellow color vision deficiency involving reduced blue cone sensitivity.' },
  { word: 'typography', pos: 'noun', pronunciation: '/taɪˈpɒɡ.rə.fi/', definition: 'The choice and arrangement of typefaces, sizes, line heights, and spacing.' },
  { word: 'utterance', pos: 'noun', pronunciation: '/ˈʌt.ər.əns/', definition: 'A spoken phrase or sentence queued for text-to-speech playback.' },
  { word: 'validation', pos: 'noun', pronunciation: '/ˌvæl.ɪˈdeɪ.ʃən/', definition: 'Verifying that data or a signed key satisfies strict structural or cryptographic rules.' },
  { word: 'visual', pos: 'adjective', pronunciation: '/ˈvɪʒ.u.əl/', definition: 'Relating to sight and how text appears on screen.' },
  { word: 'vocabulary', pos: 'noun', pronunciation: '/voʊˈkæb.jə.ler.i/', definition: 'The body of words known or used in a particular text.' },
  { word: 'wavelength', pos: 'noun', pronunciation: '/ˈweɪv.leŋθ/', definition: 'A physical property of light that determines perceived color.' },
  { word: 'workflow', pos: 'noun', pronunciation: '/ˈwɜːrk.floʊ/', definition: 'The sequence of steps a reader follows to open, customize, and read content.' },
  // Common science & general reading terms for sample documents
  { word: 'planet', pos: 'noun', pronunciation: '/ˈplæn.ɪt/', definition: 'A celestial body moving in an elliptical orbit around a star.' },
  { word: 'orbit', pos: 'noun', pronunciation: '/ˈɔːr.bɪt/', definition: 'The curved path of a celestial object or spacecraft around a star, planet, or moon.' },
  { word: 'gravity', pos: 'noun', pronunciation: '/ˈɡræv.ə.ti/', definition: 'The natural force of attraction between objects that have mass.' },
  { word: 'atmosphere', pos: 'noun', pronunciation: '/ˈæt.mə.sfɪər/', definition: 'The envelope of gases surrounding a planet or celestial body.' },
  { word: 'solar', pos: 'adjective', pronunciation: '/ˈsoʊ.lər/', definition: 'Relating to or determined by the sun.' },
  { word: 'galaxy', pos: 'noun', pronunciation: '/ˈɡæl.ək.si/', definition: 'A vast system of millions or billions of stars, gas, and dust bound by gravity.' },
  { word: 'telescope', pos: 'noun', pronunciation: '/ˈtel.ɪ.skoʊp/', definition: 'An optical instrument designed to collect light and make distant astronomical objects appear nearer and clearer.' },
  { word: 'radiation', pos: 'noun', pronunciation: '/ˌreɪ.diˈeɪ.ʃən/', definition: 'Energy emitted as electromagnetic waves or moving subatomic particles.' },
  { word: 'interface', pos: 'noun', pronunciation: '/ˈɪn.tər.feɪs/', definition: 'A shared boundary across which two software components or a user and tool communicate.' },
  { word: 'architecture', pos: 'noun', pronunciation: '/ˈɑːr.kɪ.tek.tʃər/', definition: 'The fundamental structure and organization of a software system.' },
  { word: 'adapter', pos: 'noun', pronunciation: '/əˈdæp.tər/', definition: 'A module that translates a platform-agnostic interface to a specific runtime API.' },
  { word: 'protocol', pos: 'noun', pronunciation: '/ˈproʊ.tə.kɒl/', definition: 'A defined set of rules governing how messages or data are structured and exchanged.' },
  { word: 'latency', pos: 'noun', pronunciation: '/ˈleɪ.tən.si/', definition: 'The delay before a transfer of data or response begins.' },
  { word: 'resilience', pos: 'noun', pronunciation: '/rɪˈzɪl.i.əns/', definition: 'The ability of a system to continue functioning smoothly when one part fails.' },
  { word: 'people', pos: 'noun', pronunciation: '/ˈpiː.pəl/', definition: 'Human beings considered collectively or as individuals with diverse experiences.' },
  { word: 'dense', pos: 'adjective', pronunciation: '/dens/', definition: 'Closely packed together with little open space, making text harder to scan visually.' },
  { word: 'screen', pos: 'noun', pronunciation: '/skriːn/', definition: 'The flat illuminated display surface of a computer, tablet, or phone.' },
  { word: 'bright', pos: 'adjective', pronunciation: '/braɪt/', definition: 'Emitting or reflecting a strong amount of light.' },
  { word: 'warmth', pos: 'noun', pronunciation: '/wɔːrmθ/', definition: 'A gentle amber or cream color tone that reduces cool blue-white screen glare.' },
  { word: 'sun', pos: 'noun', pronunciation: '/sʌn/', definition: 'The yellow dwarf star at the center of our solar system around which Earth orbits.' },
  { word: 'earth', pos: 'noun', pronunciation: '/ɜːrθ/', definition: 'The third planet from the Sun and the only known world maintaining liquid surface water and life.' },
  { word: 'mars', pos: 'noun', pronunciation: '/mɑːrz/', definition: 'The fourth planet from the Sun, known for its iron-oxide dust and thin carbon dioxide atmosphere.' },
  { word: 'mercury', pos: 'noun', pronunciation: '/ˈmɜːr.kjər.i/', definition: 'The smallest and innermost planet in our solar system.' },
  { word: 'venus', pos: 'noun', pronunciation: '/ˈviː.nəs/', definition: 'The second planet from the Sun, wrapped in a thick, heat-trapping atmosphere.' },
  { word: 'water', pos: 'noun', pronunciation: '/ˈwɔː.tər/', definition: 'A clear liquid compound essential for life on Earth.' },
  { word: 'space', pos: 'noun', pronunciation: '/speɪs/', definition: 'The vast expanse beyond planetary atmospheres, or blank visual room around text.' },
  { word: 'device', pos: 'noun', pronunciation: '/dɪˈvaɪs/', definition: 'A local piece of hardware—such as a laptop, phone, or tablet—that runs software on-premises.' },
  { word: 'software', pos: 'noun', pronunciation: '/ˈsɒft.weər/', definition: 'Programs and instructions executed by a computer or mobile device.' },
  { word: 'temperature', pos: 'noun', pronunciation: '/ˈtem.prə.tʃər/', definition: 'The degree of heat or cold present in a substance, object, or atmosphere.' },
  { word: 'infrared', pos: 'adjective', pronunciation: '/ˌɪn.frəˈred/', definition: 'Electromagnetic wavelengths longer than visible red light, often sensed as heat.' },
  { word: 'asteroid', pos: 'noun', pronunciation: '/ˈæs.tə.rɔɪd/', definition: 'A small rocky body orbiting the Sun, mostly between Mars and Jupiter.' },
  { word: 'letter', pos: 'noun', pronunciation: '/ˈlet.ər/', definition: 'A written character representing one or more speech sounds in an alphabet.' },
  { word: 'word', pos: 'noun', pronunciation: '/wɜːrd/', definition: 'A single distinct meaningful unit of spoken or written language.' },
  { word: 'line', pos: 'noun', pronunciation: '/laɪn/', definition: 'A horizontal row of printed or displayed text across a column.' },
  { word: 'support', pos: 'noun', pronunciation: '/səˈpɔːrt/', definition: 'Practical assistance or customizable options that make a task easier to accomplish.' },
  { word: 'reduce', pos: 'verb', pronunciation: '/rɪˈdjuːs/', definition: 'To make smaller or lessen in intensity, crowding, or strain.' },
  { word: 'mind', pos: 'noun', pronunciation: '/maɪnd/', definition: 'The set of cognitive faculties enabling perception, thought, memory, and awareness.' },
];

const DICTIONARY_MAP = new Map<string, DictionaryEntry>();
for (const entry of ENTRIES) {
  DICTIONARY_MAP.set(entry.word.toLowerCase(), entry);
}

const SUFFIX_RULES: Array<[RegExp, string]> = [
  [/ies$/, 'y'],
  [/ves$/, 'f'],
  [/ing$/, ''],
  [/ing$/, 'e'],
  [/ed$/, ''],
  [/ed$/, 'e'],
  [/es$/, ''],
  [/s$/, ''],
  [/ly$/, ''],
];

export function lookupWord(rawWord: string): DictionaryEntry | null {
  const clean = rawWord.toLowerCase().replace(/[^a-z-]/g, '');
  if (!clean) return null;

  const direct = DICTIONARY_MAP.get(clean);
  if (direct) return direct;

  for (const [pattern, replacement] of SUFFIX_RULES) {
    if (pattern.test(clean)) {
      const stem = clean.replace(pattern, replacement);
      if (stem.length >= 3 && DICTIONARY_MAP.has(stem)) {
        return DICTIONARY_MAP.get(stem)!;
      }
    }
  }

  return null;
}

export function getDictionarySize(): number {
  return DICTIONARY_MAP.size;
}
