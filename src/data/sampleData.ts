// @ts-nocheck -- imported from original Cognify project (looser TS settings)

// ============================================
// COGNIFY — LEARNING DATA
// ============================================

// STUDENT MASTERY

export type AnswerStatus =
  | 'correct'
  | 'incorrect'
  | 'uncertain'
  | 'unassessed'

export type AnswerRecord = {
  concept: string
  question: string
  response: string
  correct: boolean | null
  status?: AnswerStatus
  timestamp: number
}

export type MasteryItem = {
  concept: string
  prob: number
}

export type StudentMastery = {
  id: string
  name: string
  mastery: MasteryItem[]
  uncertain: string[]
  answerHistory: AnswerRecord[]
  misconceptions: string[]
}

export const demoStudent: StudentMastery = {
  id: 'student-001',
  name: 'Student',
  mastery: [
    { concept: 'Fundamentals', prob: 0.65 },
    { concept: 'Problem Solving', prob: 0.45 },
    { concept: 'Applications', prob: 0.35 },
  ],
  uncertain: ['Problem Solving', 'Applications'],
  answerHistory: [],
  misconceptions: [],
}

// ============================================
// STORAGE
// ============================================

const STORAGE_PREFIX = 'cognify-progress-v3'
const PREVIOUS_STORAGE_PREFIX = 'cognify-progress-v2'
const LEGACY_STORAGE_KEY = 'cognify-student-data'

function normalizeStoragePart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function getStorageKey(
  subject = 'General',
  topic = 'Learning'
): string {
  return `${STORAGE_PREFIX}:${normalizeStoragePart(subject)}:${normalizeStoragePart(topic)}`
}

function createEmptyStudent(): StudentMastery {
  return {
    ...demoStudent,
    mastery: demoStudent.mastery.map(item => ({ ...item })),
    uncertain: [...demoStudent.uncertain],
    answerHistory: [],
    misconceptions: [],
  }
}

// ============================================
// DATA MIGRATION
// ============================================

function migrateStudentData(
  student: StudentMastery
): StudentMastery {
  const answerHistory = (student.answerHistory ?? []).map(record => {
    const correct = record.correct === true ? true : null

    return {
      ...record,
      correct,
      status: record.status ??
        (correct === true ? 'correct' : 'unassessed') as AnswerStatus,
    }
  })

  const uncertainConcepts = answerHistory
    .filter(record => record.status === 'uncertain')
    .map(record => record.concept)

  return {
    ...student,
    mastery: student.mastery ?? [],
    uncertain: Array.from(new Set([
      ...(student.uncertain ?? []),
      ...uncertainConcepts,
    ])),
    answerHistory,
    misconceptions: student.misconceptions ?? [],
  }
}

// ============================================
// LOAD AND SAVE STUDENT DATA
// ============================================

export function loadStudent(
  subject = 'General',
  topic = 'Learning'
): StudentMastery {
  const storageKey = getStorageKey(subject, topic)

  try {
    const stored = localStorage.getItem(storageKey)

    if (stored) {
      return migrateStudentData(
        JSON.parse(stored) as StudentMastery
      )
    }

    const previousKey =
      `${PREVIOUS_STORAGE_PREFIX}:${normalizeStoragePart(subject)}:${normalizeStoragePart(topic)}`

    const previousData = localStorage.getItem(previousKey)

    if (previousData) {
      const migrated = migrateStudentData(
        JSON.parse(previousData) as StudentMastery
      )

      saveStudent(migrated, subject, topic)
      return migrated
    }

    if (subject === 'General' && topic === 'Learning') {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)

      if (legacy) {
        const migrated = migrateStudentData(
          JSON.parse(legacy) as StudentMastery
        )

        saveStudent(migrated, subject, topic)
        return migrated
      }
    }
  } catch (error) {
    console.error('Could not load student data:', error)
  }

  return createEmptyStudent()
}

export function saveStudent(
  student: StudentMastery,
  subject = 'General',
  topic = 'Learning'
): void {
  try {
    localStorage.setItem(
      getStorageKey(subject, topic),
      JSON.stringify(student)
    )
  } catch (error) {
    console.error('Could not save student data:', error)
  }
}

// ============================================
// UNCERTAINTY TRACKING
// ============================================

export function isUncertainResponse(response: string): boolean {
  const normalized = response
    .toLowerCase()
    // Remove punctuation instead of replacing it with spaces.
    // This makes "don't" become "dont".
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return false

  const uncertaintyPhrases = [
    'i dont know',
    'dont know',
    'do not know',
    'i do not know',
    'i am not sure',
    'im not sure',
    'not sure',
    'i have no idea',
    'no idea',
    'i dont understand',
    'dont understand',
    'i do not understand',
    'do not understand',
    'i cannot explain',
    'cannot explain',
    'i am confused',
    'im confused',
    'i dont get it',
    'dont get it',
    'i am clueless',
    'no clue',
  ]

  return uncertaintyPhrases.some(phrase =>
    normalized === phrase ||
    normalized.startsWith(`${phrase} `)
  )
}

export function updateUncertainConcepts(
  student: StudentMastery,
  concept: string,
  status: AnswerStatus
): StudentMastery {
  const otherUncertain = student.uncertain.filter(
    item => item !== concept
  )

  return {
    ...student,
    uncertain: status === 'uncertain'
      ? [...otherUncertain, concept]
      : otherUncertain,
  }
}

// ============================================
// ASSESSMENT AND MASTERY CALCULATIONS
// ============================================

export function getMasteryPercentage(
  student: StudentMastery
): number | null {
  const assessedAnswers = student.answerHistory.filter(
    answer => answer.correct !== null
  )

  if (assessedAnswers.length === 0) return null

  const correctAnswers = assessedAnswers.filter(
    answer => answer.correct === true
  ).length

  return Math.round(
    (correctAnswers / assessedAnswers.length) * 100
  )
}

export function getConceptMastery(
  student: StudentMastery,
  concept: string
): number | null {
  const assessedAnswers = student.answerHistory.filter(
    answer =>
      answer.concept === concept &&
      answer.correct !== null
  )

  if (assessedAnswers.length === 0) return null

  const correctAnswers = assessedAnswers.filter(
    answer => answer.correct === true
  ).length

  return Math.round(
    (correctAnswers / assessedAnswers.length) * 100
  )
}

export function getAssessmentStats(student: StudentMastery) {
  const totalResponses = student.answerHistory.length

  const assessedAnswers = student.answerHistory.filter(
    answer => answer.correct !== null
  )

  const correctAnswers = assessedAnswers.filter(
    answer => answer.correct === true
  ).length

  const incorrectAnswers = assessedAnswers.filter(
    answer => answer.correct === false
  ).length

  const uncertainAnswers = student.answerHistory.filter(
    answer =>
      answer.status === 'uncertain' ||
      (
        answer.status === undefined &&
        isUncertainResponse(answer.response)
      )
  ).length

  const unassessedAnswers = student.answerHistory.filter(
    answer =>
      answer.correct === null &&
      answer.status !== 'uncertain' &&
      !(
        answer.status === undefined &&
        isUncertainResponse(answer.response)
      )
  ).length

  return {
    totalResponses,
    assessedAnswers: assessedAnswers.length,
    correctAnswers,
    incorrectAnswers,
    uncertainAnswers,
    unassessedAnswers,
    accuracy: assessedAnswers.length === 0
      ? null
      : Math.round(
          (correctAnswers / assessedAnswers.length) * 100
        ),
  }
}

// ============================================
// RETRIEVE SAVED LEARNING PATHS
// ============================================

export function getSavedLearningPaths(): {
  subject: string
  topic: string
  student: StudentMastery
}[] {
  const paths: {
    subject: string
    topic: string
    student: StudentMastery
  }[] = []

  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)

      if (!key?.startsWith(`${STORAGE_PREFIX}:`)) continue

      const parts = key.split(':')
      if (parts.length !== 3) continue

      const stored = localStorage.getItem(key)
      if (!stored) continue

      paths.push({
        subject: parts[1].replace(/-/g, ' '),
        topic: parts[2].replace(/-/g, ' '),
        student: migrateStudentData(
          JSON.parse(stored) as StudentMastery
        ),
      })
    }
  } catch (error) {
    console.error('Could not retrieve saved learning paths:', error)
  }

  return paths
}

// ============================================
// CONCEPT GRAPH DATA
// ============================================

export type ConceptNode = {
  id: string
  label: string
  description: string
  prerequisites: string[]
}

function createNodes(
  items: [string, string, string[]][]
): ConceptNode[] {
  return items.map(([id, label, prerequisites]) => ({
    id,
    label,
    description: `${label} — explore this concept, understand its fundamentals, and practise applying it.`,
    prerequisites,
  }))
}

// ============================================
// TOPIC-SPECIFIC CONCEPT MAPS
// ============================================

type TopicMap = {
  subject: string
  topic: string
  nodes: ConceptNode[]
}

const topicMaps: TopicMap[] = [
  {
    subject: 'C++',
    topic: 'Pointers',
    nodes: createNodes([
      ['pointer-basics', 'Pointer Basics', []],
      ['memory-address', 'Memory Addresses', ['pointer-basics']],
      ['dereferencing', 'Dereferencing', ['memory-address']],
      ['null-pointers', 'Null Pointers', ['pointer-basics']],
      ['pointer-arithmetic', 'Pointer Arithmetic', ['dereferencing']],
      ['pointer-arrays', 'Pointers and Arrays', ['pointer-arithmetic']],
      ['dynamic-memory', 'Dynamic Memory', ['dereferencing']],
      ['smart-pointers', 'Smart Pointers', ['dynamic-memory']],
    ]),
  },

  {
    subject: 'C++',
    topic: 'Recursion',
    nodes: createNodes([
      ['recursion-basics', 'Recursion Basics', []],
      ['base-case', 'Base Case', ['recursion-basics']],
      ['recursive-case', 'Recursive Case', ['recursion-basics']],
      ['call-stack', 'Call Stack', ['recursive-case']],
      ['recursion-tracing', 'Tracing Recursive Calls', ['base-case', 'call-stack']],
      ['recursion-arrays', 'Recursion with Arrays', ['recursion-tracing']],
      ['recursion-backtracking', 'Backtracking', ['recursion-tracing']],
    ]),
  },

  {
    subject: 'C++',
    topic: 'Arrays',
    nodes: createNodes([
      ['array-basics', 'Array Basics', []],
      ['array-indexing', 'Indexing', ['array-basics']],
      ['array-traversal', 'Array Traversal', ['array-indexing']],
      ['array-insertion', 'Insertion', ['array-traversal']],
      ['array-deletion', 'Deletion', ['array-traversal']],
      ['searching-arrays', 'Searching', ['array-traversal']],
      ['sorting-arrays', 'Sorting', ['searching-arrays']],
      ['two-dimensional-arrays', '2D Arrays', ['array-basics']],
    ]),
  },

  {
    subject: 'C++',
    topic: 'Functions',
    nodes: createNodes([
      ['function-basics', 'Function Basics', []],
      ['parameters', 'Parameters', ['function-basics']],
      ['return-values', 'Return Values', ['parameters']],
      ['function-overloading', 'Function Overloading', ['function-basics']],
      ['scope', 'Variable Scope', ['function-basics']],
      ['recursion-functions', 'Recursive Functions', ['return-values']],
      ['inline-functions', 'Inline Functions', ['function-basics']],
    ]),
  },

  {
    subject: 'C++',
    topic: 'Object Oriented Programming',
    nodes: createNodes([
      ['classes', 'Classes', []],
      ['objects', 'Objects', ['classes']],
      ['constructors', 'Constructors', ['objects']],
      ['encapsulation', 'Encapsulation', ['classes']],
      ['inheritance', 'Inheritance', ['classes']],
      ['polymorphism', 'Polymorphism', ['inheritance']],
      ['abstraction', 'Abstraction', ['classes']],
    ]),
  },

  {
    subject: 'Python',
    topic: 'Recursion',
    nodes: createNodes([
      ['py-recursion-basics', 'Recursion Basics', []],
      ['py-base-case', 'Base Case', ['py-recursion-basics']],
      ['py-recursive-call', 'Recursive Calls', ['py-recursion-basics']],
      ['py-call-stack', 'Call Stack', ['py-recursive-call']],
      ['py-factorial', 'Factorial Example', ['py-base-case']],
      ['py-fibonacci', 'Fibonacci Example', ['py-factorial']],
      ['py-recursion-limit', 'Recursion Limit', ['py-call-stack']],
    ]),
  },

  {
    subject: 'Python',
    topic: 'Lists',
    nodes: createNodes([
      ['py-list-basics', 'List Basics', []],
      ['py-list-indexing', 'Indexing and Slicing', ['py-list-basics']],
      ['py-list-methods', 'List Methods', ['py-list-basics']],
      ['py-list-iteration', 'List Iteration', ['py-list-indexing']],
      ['py-list-comprehension', 'List Comprehensions', ['py-list-iteration']],
      ['py-nested-lists', 'Nested Lists', ['py-list-basics']],
      ['py-list-operations', 'List Operations', ['py-list-methods']],
    ]),
  },

  {
    subject: 'Python',
    topic: 'Functions',
    nodes: createNodes([
      ['py-function-basics', 'Function Basics', []],
      ['py-parameters', 'Parameters', ['py-function-basics']],
      ['py-arguments', 'Arguments', ['py-parameters']],
      ['py-return', 'Return Values', ['py-function-basics']],
      ['py-scope', 'Variable Scope', ['py-function-basics']],
      ['py-lambda', 'Lambda Functions', ['py-function-basics']],
      ['py-recursive-functions', 'Recursive Functions', ['py-return']],
    ]),
  },

  {
    subject: 'Java',
    topic: 'Object Oriented Programming',
    nodes: createNodes([
      ['java-classes', 'Classes', []],
      ['java-objects', 'Objects', ['java-classes']],
      ['java-constructors', 'Constructors', ['java-objects']],
      ['java-encapsulation', 'Encapsulation', ['java-classes']],
      ['java-inheritance', 'Inheritance', ['java-classes']],
      ['java-polymorphism', 'Polymorphism', ['java-inheritance']],
      ['java-abstraction', 'Abstraction', ['java-classes']],
    ]),
  },

  {
    subject: 'JavaScript',
    topic: 'DOM Manipulation',
    nodes: createNodes([
      ['js-dom-basics', 'DOM Basics', []],
      ['js-selectors', 'Element Selectors', ['js-dom-basics']],
      ['js-events', 'Event Handling', ['js-selectors']],
      ['js-content', 'Changing Content', ['js-selectors']],
      ['js-styles', 'Changing Styles', ['js-selectors']],
      ['js-create-elements', 'Creating Elements', ['js-dom-basics']],
      ['js-event-delegation', 'Event Delegation', ['js-events']],
    ]),
  },

  {
    subject: 'Web Development',
    topic: 'HTML',
    nodes: createNodes([
      ['html-structure', 'HTML Structure', []],
      ['html-elements', 'HTML Elements', ['html-structure']],
      ['html-attributes', 'HTML Attributes', ['html-elements']],
      ['html-links', 'Links and Navigation', ['html-elements']],
      ['html-images', 'Images and Media', ['html-elements']],
      ['html-forms', 'Forms and Inputs', ['html-attributes']],
      ['html-semantic', 'Semantic HTML', ['html-elements']],
    ]),
  },

  {
    subject: 'Data Structures & Algorithms',
    topic: 'Linked Lists',
    nodes: createNodes([
      ['ll-basics', 'Linked List Basics', []],
      ['ll-nodes', 'Nodes and Pointers', ['ll-basics']],
      ['ll-traversal', 'Traversal', ['ll-nodes']],
      ['ll-insertion', 'Insertion', ['ll-traversal']],
      ['ll-deletion', 'Deletion', ['ll-traversal']],
      ['ll-reversal', 'Reversing a List', ['ll-traversal']],
      ['ll-cycle', 'Cycle Detection', ['ll-traversal']],
    ]),
  },

  {
    subject: 'Artificial Intelligence',
    topic: 'Machine Learning',
    nodes: createNodes([
      ['ai-ml-intro', 'ML Fundamentals', []],
      ['ai-data', 'Training Data', ['ai-ml-intro']],
      ['ai-features', 'Features and Labels', ['ai-data']],
      ['ai-supervised', 'Supervised Learning', ['ai-features']],
      ['ai-unsupervised', 'Unsupervised Learning', ['ai-features']],
      ['ai-training', 'Model Training', ['ai-supervised']],
      ['ai-evaluation', 'Model Evaluation', ['ai-training']],
    ]),
  },

  {
    subject: 'Machine Learning',
    topic: 'Neural Networks',
    nodes: createNodes([
      ['nn-intro', 'Neural Network Basics', []],
      ['nn-neurons', 'Neurons', ['nn-intro']],
      ['nn-weights', 'Weights and Biases', ['nn-neurons']],
      ['nn-activation', 'Activation Functions', ['nn-neurons']],
      ['nn-forward', 'Forward Propagation', ['nn-weights', 'nn-activation']],
      ['nn-loss', 'Loss Functions', ['nn-forward']],
      ['nn-backprop', 'Backpropagation', ['nn-loss']],
    ]),
  },

  {
    subject: 'Mathematics',
    topic: 'Matrices',
    nodes: createNodes([
      ['matrix-basics', 'Matrix Basics', []],
      ['matrix-order', 'Order and Elements', ['matrix-basics']],
      ['matrix-types', 'Types of Matrices', ['matrix-basics']],
      ['matrix-addition', 'Matrix Addition', ['matrix-order']],
      ['matrix-multiplication', 'Matrix Multiplication', ['matrix-order']],
      ['matrix-determinant', 'Determinants', ['matrix-types']],
      ['matrix-inverse', 'Inverse of a Matrix', ['matrix-determinant']],
      ['matrix-applications', 'Applications', ['matrix-multiplication', 'matrix-inverse']],
    ]),
  },

  {
    subject: 'Physics',
    topic: "Newton's Laws of Motion",
    nodes: createNodes([
      ['newton-force', 'Force and Motion', []],
      ['newton-first', "Newton's First Law", ['newton-force']],
      ['newton-second', "Newton's Second Law", ['newton-force']],
      ['newton-third', "Newton's Third Law", ['newton-force']],
      ['newton-mass', 'Mass and Acceleration', ['newton-second']],
      ['newton-friction', 'Friction', ['newton-second']],
      ['newton-applications', 'Real-world Applications', ['newton-first', 'newton-second', 'newton-third']],
    ]),
  },

  {
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    nodes: createNodes([
      ['atom-basics', 'Structure of an Atom', []],
      ['atom-protons', 'Protons and Neutrons', ['atom-basics']],
      ['atom-electrons', 'Electrons', ['atom-basics']],
      ['atom-shells', 'Electron Shells', ['atom-electrons']],
      ['atom-config', 'Electronic Configuration', ['atom-shells']],
      ['atom-valency', 'Valency', ['atom-config']],
      ['atom-isotopes', 'Isotopes', ['atom-protons', 'atom-electrons']],
    ]),
  },
]

// ============================================
// GENERIC CUSTOM TOPIC MAP
// ============================================

function createCustomTopicMap(topic: string): ConceptNode[] {
  const cleanTopic = topic.trim() || 'Your Topic'

  return createNodes([
    ['custom-foundations', `${cleanTopic}: Fundamentals`, []],
    ['custom-key-concepts', 'Key Concepts', ['custom-foundations']],
    ['custom-components', 'Important Components', ['custom-foundations']],
    ['custom-working', 'How It Works', ['custom-key-concepts', 'custom-components']],
    ['custom-examples', 'Examples and Applications', ['custom-working']],
    ['custom-practice', 'Practice and Problem Solving', ['custom-working']],
    ['custom-advanced', 'Advanced Concepts', ['custom-practice']],
  ])
}

// ============================================
// GET CONCEPTS FOR SELECTED SUBJECT AND TOPIC
// ============================================

export function getConcepts(
  subject: string,
  topic: string
): ConceptNode[] {
  const normalize = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z0-9]/g, '')

  const selectedSubject = normalize(subject)
  const selectedTopic = normalize(topic)

  const exactMatch = topicMaps.find(map =>
    normalize(map.subject) === selectedSubject &&
    normalize(map.topic) === selectedTopic
  )

  if (exactMatch) return exactMatch.nodes

  const topicMatch = topicMaps.find(map =>
    normalize(map.topic) === selectedTopic
  )

  if (topicMatch) return topicMatch.nodes

  return createCustomTopicMap(topic)
}

// ============================================
// DEMO AGENT INFORMATION
// ============================================

export const demoAgents = [
  {
    id: 'diagnostic',
    name: 'Diagnostic Agent',
    task: 'Identifies existing knowledge and learning gaps.',
    status: 'Ready',
    findings: 'Uses the selected topic and available student progress data. No live AI diagnosis yet.',
  },
  {
    id: 'planner',
    name: 'Learning Planner',
    task: 'Organizes concepts into a learning sequence.',
    status: 'Ready',
    findings: 'Displays the predefined prerequisite relationships in the concept graph.',
  },
  {
    id: 'tutor',
    name: 'AI Tutor',
    task: 'Supports concept explanations and practice.',
    status: 'Prototype',
    findings: 'Learning prompts are currently template-based. AI model integration is pending.',
  },
  {
    id: 'assessor',
    name: 'Assessment Agent',
    task: 'Reviews submitted answers.',
    status: 'Prototype',
    findings: 'The current demo uses basic answer checks rather than AI-based evaluation.',
  },
]

// ============================================
// C++ QUESTION BANK
// ============================================

export type QuestionItem = {
  question: string
  answer: string
  explanation: string
}

export const questionBank: Record<string, QuestionItem> = {
  vars: {
    question: 'What is a variable in C++? Give one example.',
    answer: 'variable',
    explanation: 'A variable is a named storage location that holds a value.',
  },

  types: {
    question: 'What is the difference between int and float in C++?',
    answer: 'int',
    explanation: 'int stores whole numbers, while float stores decimal numbers.',
  },

  control: {
    question: 'What is the purpose of an if statement in C++?',
    answer: 'condition',
    explanation: 'An if statement executes a block of code when a condition is true.',
  },

  functions: {
    question: 'What is a function in C++?',
    answer: 'function',
    explanation: 'A function is a reusable block of code designed to perform a task.',
  },

  pointers: {
    question: 'What does a pointer store in C++?',
    answer: 'address',
    explanation: 'A pointer stores the memory address of another variable.',
  },

  memory: {
    question: 'What is dynamic memory allocation?',
    answer: 'memory',
    explanation: 'Dynamic memory allocation reserves memory while a program is running.',
  },
}
