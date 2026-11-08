// @ts-nocheck -- imported from original Cognify project (looser TS settings)

export type ConceptRubric = {
  concept: string
  question: string
  criteria: {
    id: string
    description: string
    acceptedIdeas: string[]
    points: number
  }[]
  commonMisconceptions: {
    description: string
    indicators: string[]
  }[]
}

export const assessmentRubrics: Record<string, ConceptRubric> = {
  'Pointer Basics': {
    concept: 'Pointer Basics',
    question: 'What is a pointer in C++? Explain its purpose with an example.',
    criteria: [
      {
        id: 'pointer-definition',
        description: 'Pointer definition: Explains that a pointer is a variable that stores the memory address of another variable instead of a direct value.',
        acceptedIdeas: [
          'memory address',
          'address of a variable',
          'address of another',
          'stores an address',
          'holds the address',
          'variable that stores memory address',
          'variable storing another variables memory address',
          'stores another variables memory address',
          'stores the address of another variable',
          'stores memory address instead of direct value',
          'stores the memory address of another variable instead of a direct value',
          'holds the location of another variable in memory',
          'stores memory location',
          'points to the address of a variable',
        ],
        points: 40,
      },
      {
        id: 'practical-purpose',
        description: 'Practical purpose: Explains why pointers are used (e.g. dynamic memory allocation, passing large data by reference without copying, or linked data structures).',
        acceptedIdeas: [
          'pass by reference',
          'dynamic memory',
          'avoid copying large objects',
          'efficiency',
          'dynamic allocation',
          'data structures',
          'linked lists',
          'trees',
          'heap memory',
          'manipulate original variable',
          'share memory',
        ],
        points: 20,
      },
      {
        id: 'dereferencing-mechanism',
        description: 'Dereferencing and operational mechanism: Explains indirection, the * dereference operator, and how accessing *ptr reads or modifies the target variable.',
        acceptedIdeas: [
          'dereference',
          'dereferencing',
          '* operator',
          'asterisk to access value',
          'indirection',
          'indirectly access',
          'read value at address',
          'modify value through pointer',
          '*ptr',
          'access the target memory',
        ],
        points: 20,
      },
      {
        id: 'code-example',
        description: 'Concrete C++ code example: Demonstrates pointer declaration and initialization in code (e.g., int val = 42; int* ptr = &val;).',
        acceptedIdeas: [
          'for example',
          'int* ptr = &',
          'int *ptr = &',
          'ptr = &var',
          'code example',
          'sample code',
          'cout << *ptr',
          'int* p = &x',
          'int* ptr',
        ],
        points: 20,
      },
    ],
    commonMisconceptions: [
      {
        description: 'Confuses a pointer with the value stored at an address.',
        indicators: [
          'pointer stores the value instead of address',
          'pointer stores the actual value',
          'pointer holds the actual value',
          'stores value rather than address',
          'pointer is just a variable value',
        ],
      },
      {
        description: 'Confuses the address-of operator (&) with dereferencing (*).',
        indicators: [
          '& is used to get the value',
          'ampersand dereferences',
          '& gives the value',
        ],
      },
    ],
  },

  'Memory Addresses': {
    concept: 'Memory Addresses',
    question: 'What is a memory address, and how can a C++ program access it?',
    criteria: [
      {
        id: 'address-definition',
        description: 'Explains that a memory address identifies a specific location in computer memory (RAM).',
        acceptedIdeas: [
          'location in memory',
          'memory location',
          'address of a variable',
          'hexadecimal address',
          'byte location',
          'ram location',
        ],
        points: 50,
      },
      {
        id: 'address-operator',
        description: 'Understands the purpose of the & (address-of) operator.',
        acceptedIdeas: [
          'address-of operator',
          'ampersand',
          'get the address',
          '& operator',
          'prefix with &',
        ],
        points: 50,
      },
    ],
    commonMisconceptions: [
      {
        description: 'Thinks a memory address is the value stored in a variable.',
        indicators: [
          'address is the value stored',
          'memory address contains the variable number',
          'address is the data',
        ],
      },
      {
        description: 'Believes memory addresses remain identical across different program executions.',
        indicators: [
          'address is always the same number',
          'static memory address every run',
        ],
      },
    ],
  },

  'Dereferencing': {
    concept: 'Dereferencing',
    question: 'What does dereferencing a pointer mean in C++?',
    criteria: [
      {
        id: 'dereference-definition',
        description: 'Explains that dereferencing accesses or modifies the value at the pointed-to address.',
        acceptedIdeas: [
          'access the value',
          'value at the address',
          'value pointed to',
          'modify the value',
          'read the data at address',
        ],
        points: 60,
      },
      {
        id: 'dereference-operator',
        description: 'Identifies * (asterisk) as the dereference operator.',
        acceptedIdeas: [
          'asterisk operator',
          'dereference operator',
          '*ptr',
          '* operator',
        ],
        points: 40,
      },
    ],
    commonMisconceptions: [
      {
        description: 'Confuses dereferencing with obtaining a variable address.',
        indicators: [
          'dereferencing gets the address',
          'dereference returns memory location',
        ],
      },
      {
        description: 'Attempts to dereference an uninitialized or null pointer without checking.',
        indicators: [
          'can dereference any pointer safely',
          'null pointer can be read directly',
        ],
      },
    ],
  },

  'Null Pointers': {
    concept: 'Null Pointers',
    question: 'What is a null pointer in C++, why should you use nullptr, and what happens if you dereference one?',
    criteria: [
      {
        id: 'nullptr-definition',
        description: 'Explains that a null pointer points to no valid memory location / address 0.',
        acceptedIdeas: [
          'points to nothing',
          'points to null',
          'points to no valid object',
          'nullptr',
          'address 0',
          'invalid address',
          'null address',
        ],
        points: 40,
      },
      {
        id: 'nullptr-vs-null',
        description: 'Explains that nullptr is type-safe compared to legacy NULL or 0.',
        acceptedIdeas: [
          'nullptr is type-safe',
          'c++11 nullptr',
          'type safe keyword',
          'avoids ambiguity',
          'prefer nullptr',
        ],
        points: 30,
      },
      {
        id: 'null-dereference-danger',
        description: 'Explains that dereferencing a null pointer leads to undefined behavior or segmentation fault / crash.',
        acceptedIdeas: [
          'segmentation fault',
          'segfault',
          'crash',
          'undefined behavior',
          'runtime error',
          'access violation',
        ],
        points: 30,
      },
    ],
    commonMisconceptions: [
      {
        description: 'Thinks a null pointer points to a variable containing zero.',
        indicators: [
          'points to variable with value 0',
          'stores the number 0 as value',
        ],
      },
      {
        description: 'Confuses uninitialized pointers (wild pointers) with null pointers.',
        indicators: [
          'uninitialized pointer is null',
          'pointers start as null by default',
        ],
      },
    ],
  },

  'Pointer Arithmetic': {
    concept: 'Pointer Arithmetic',
    question: 'How does pointer arithmetic work in C++ when you add or subtract an integer from a pointer?',
    criteria: [
      {
        id: 'scaled-by-size',
        description: 'Explains that adding an integer n advances the pointer by n * sizeof(Type) bytes.',
        acceptedIdeas: [
          'sizeof',
          'scaled by data type',
          'multiplied by type size',
          'bytes of the type',
          'size of the elements',
          'size of int',
        ],
        points: 60,
      },
      {
        id: 'array-indexing-relation',
        description: 'Relates pointer arithmetic to contiguous array navigation.',
        acceptedIdeas: [
          'next element in array',
          'traverse an array',
          'consecutive elements',
          'pointer plus 1 is next element',
        ],
        points: 40,
      },
    ],
    commonMisconceptions: [
      {
        description: 'Thinks pointer + 1 always increments the address by exactly 1 byte.',
        indicators: [
          'adds 1 byte',
          'increments by one byte',
          'address increases by 1 byte regardless of type',
        ],
      },
      {
        description: 'Believes you can multiply or divide pointers.',
        indicators: [
          'multiply two pointers',
          'divide pointers',
        ],
      },
    ],
  },

  'Pointers and Arrays': {
    concept: 'Pointers and Arrays',
    question: 'What is the relationship between pointers and arrays in C++?',
    criteria: [
      {
        id: 'array-decay',
        description: 'Explains that array names decay to a pointer to their first element.',
        acceptedIdeas: [
          'decay to a pointer',
          'points to first element',
          'address of first element',
          '&arr[0]',
          'array decays',
        ],
        points: 50,
      },
      {
        id: 'bracket-dereference-equivalence',
        description: 'Understands that arr[i] is equivalent to *(arr + i).',
        acceptedIdeas: [
          '*(arr + i)',
          'bracket notation is pointer offset',
          'dereferencing with offset',
          'syntactic sugar',
        ],
        points: 50,
      },
    ],
    commonMisconceptions: [
      {
        description: 'Believes arrays and pointers are 100% identical types (ignoring sizeof and reassignability).',
        indicators: [
          'array is just a pointer',
          'can reassign array name to another address',
        ],
      },
    ],
  },

  'Dynamic Memory': {
    concept: 'Dynamic Memory',
    question: 'How do you allocate and deallocate dynamic memory on the heap in C++, and why must memory be freed?',
    criteria: [
      {
        id: 'new-operator',
        description: 'Explains that new allocates memory on the heap at runtime and returns a pointer.',
        acceptedIdeas: [
          'new operator',
          'heap memory',
          'allocated at runtime',
          'returns a pointer',
          'free store',
        ],
        points: 40,
      },
      {
        id: 'delete-operator',
        description: 'Explains that delete (or delete[]) releases the allocated memory back to the system.',
        acceptedIdeas: [
          'delete operator',
          'delete[]',
          'frees memory',
          'release memory',
          'deallocate',
        ],
        points: 30,
      },
      {
        id: 'memory-leaks',
        description: 'Explains that failing to free heap memory causes memory leaks.',
        acceptedIdeas: [
          'memory leak',
          'runs out of memory',
          'unfreed memory',
          'resource leak',
        ],
        points: 30,
      },
    ],
    commonMisconceptions: [
      {
        description: 'Thinks heap memory is automatically freed when the pointer variable goes out of scope.',
        indicators: [
          'heap memory is freed when function ends',
          'automatically deleted when leaving scope',
        ],
      },
      {
        description: 'Uses delete instead of delete[] for arrays allocated with new[].',
        indicators: [
          'delete arr without brackets for array',
        ],
      },
    ],
  },

  'Smart Pointers': {
    concept: 'Smart Pointers',
    question: 'What are smart pointers in modern C++ (unique_ptr and shared_ptr) and what problem do they solve?',
    criteria: [
      {
        id: 'raii-automatic-free',
        description: 'Explains automatic resource management (RAII) and avoiding memory leaks.',
        acceptedIdeas: [
          'raii',
          'automatic deallocation',
          'destructor deletes',
          'prevents memory leaks',
          'automatically freed',
        ],
        points: 40,
      },
      {
        id: 'unique-ptr',
        description: 'Explains std::unique_ptr for exclusive, non-copyable ownership.',
        acceptedIdeas: [
          'unique_ptr',
          'exclusive ownership',
          'single owner',
          'move only',
          'cannot be copied',
        ],
        points: 30,
      },
      {
        id: 'shared-ptr',
        description: 'Explains std::shared_ptr for reference-counted shared ownership.',
        acceptedIdeas: [
          'shared_ptr',
          'reference count',
          'reference counting',
          'multiple owners',
          'shared ownership',
        ],
        points: 30,
      },
    ],
    commonMisconceptions: [
      {
        description: 'Thinks smart pointers add massive runtime overhead or eliminate the need to understand pointers.',
        indicators: [
          'smart pointers are garbage collectors',
          'huge performance penalty',
        ],
      },
    ],
  },

  'Nodes and Pointers': {
    concept: 'Nodes and Pointers',
    question: 'What is a node in a linked list, and how do pointers connect nodes?',
    criteria: [
      {
        id: 'node-structure',
        description: 'Explains that a node stores data and a link/pointer to another node.',
        acceptedIdeas: [
          'stores data and a pointer',
          'data and next pointer',
          'data and link',
          'contains data and address',
          'value and pointer to next',
        ],
        points: 35,
      },
      {
        id: 'pointer-connection',
        description: 'Explains that pointers store the addresses of subsequent nodes to link them.',
        acceptedIdeas: [
          'pointer stores the address of the next node',
          'points to the next node',
          'connects nodes using addresses',
          'stores the address of another node',
          'links one node to another',
        ],
        points: 35,
      },
      {
        id: 'linked-list-structure',
        description: 'Understands that nodes form a connected sequence or chain in memory.',
        acceptedIdeas: [
          'connected sequence of nodes',
          'nodes are linked together',
          'each node points to the next',
          'forms a chain of nodes',
          'linked structure',
        ],
        points: 30,
      },
    ],
    commonMisconceptions: [
      {
        description: 'Thinks linked-list nodes must be stored next to each other in memory.',
        indicators: [
          'nodes are stored next to each other',
          'nodes must be contiguous in memory',
          'nodes are always adjacent in memory',
        ],
      },
      {
        description: 'Thinks a pointer stores the complete next node rather than its address.',
        indicators: [
          'pointer stores the entire next node',
          'pointer contains the whole node',
        ],
      },
    ],
  },
}

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Generates a tailored, meaningful concept rubric for any subject or topic. */
export function buildDynamicRubric(
  concept: string,
  subject?: string,
  topic?: string
): ConceptRubric {
  const normConcept = concept.trim()
  const normSubject = (subject || '').trim()
  const normTopic = (topic || '').trim()
  const combined = `${normSubject} ${normTopic} ${normConcept}`.toLowerCase()

  // 1. Domain-specific keyword enrichment
  let domainKeywords: string[] = []
  let domainMechanics: string[] = []
  let domainExamples: string[] = []
  let commonMisconceptions: { description: string; indicators: string[] }[] = []

  if (/react|jsx|component|hook|redux|frontend/i.test(combined)) {
    domainKeywords = ['component', 'jsx', 'ui', 'render', 'props', 'state', 'reusable', 'virtual dom', 'declarative', 'element']
    domainMechanics = ['unidirectional data flow', 're-render', 'hook', 'useeffect', 'usestate', 'lifecycle', 'updates', 'props passing', 'hierarchy', 'event handler']
    domainExamples = ['function', 'return', 'const', 'export', 'import', '<', '>', 'button', 'div', 'code example']
    commonMisconceptions = [
      {
        description: 'Confuses props (read-only parent inputs) with state (internal mutable component data).',
        indicators: ['props can be changed directly', 'modify props', 'change props inside child', 'props are mutable'],
      },
      {
        description: 'Believes state changes update variables immediately and synchronously.',
        indicators: ['state updates immediately', 'state is synchronous', 'setstate changes value on next line'],
      },
    ]
  } else if (/python|pandas|numpy|django|flask/i.test(combined)) {
    domainKeywords = ['python', 'variable', 'object', 'function', 'class', 'indentation', 'interpreted', 'data structure', 'module', 'type']
    domainMechanics = ['dynamic typing', 'memory management', 'scope', 'call stack', 'reference', 'mutable', 'immutable', 'iteration', 'return value']
    domainExamples = ['def ', 'return ', 'for ', 'in ', 'print', 'self', 'import ', 'class ', 'list', 'dict']
    commonMisconceptions = [
      {
        description: 'Confuses shallow copy and deep copy or mutable vs immutable references.',
        indicators: ['all variables are copied by value', 'lists are immutable', 'strings can be modified in place'],
      },
      {
        description: 'Misunderstands function variable scope and global vs local namespaces.',
        indicators: ['variables inside functions are global by default', 'scope is not isolated'],
      },
    ]
  } else if (/javascript|node|async|promise|closure/i.test(combined)) {
    domainKeywords = ['javascript', 'function', 'object', 'asynchronous', 'scope', 'prototype', 'event loop', 'runtime', 'browser']
    domainMechanics = ['callback', 'promise', 'async', 'await', 'closure', 'lexical scope', 'call stack', 'microtask', 'non-blocking', 'event']
    domainExamples = ['const', 'let', 'function', 'return', '=>', 'new Promise', 'then', 'catch', 'console.log']
    commonMisconceptions = [
      {
        description: 'Assumes asynchronous operations run on multiple concurrent operating system threads.',
        indicators: ['javascript is multithreaded by default', 'async runs on another thread', 'threads execute promises in parallel'],
      },
    ]
  } else if (/algorithm|data structure|tree|graph|sort|stack|queue|hash|search/i.test(combined)) {
    domainKeywords = ['data structure', 'algorithm', 'complexity', 'node', 'element', 'index', 'pointer', 'reference', 'storage', 'collection']
    domainMechanics = ['big o', 'time complexity', 'space complexity', 'traversal', 'insertion', 'deletion', 'search', 'recursion', 'iteration', 'memory overhead']
    domainExamples = ['o(1)', 'o(n)', 'o(log n)', 'array', 'pointer', 'loop', 'head', 'tail', 'root', 'tree', 'code']
    commonMisconceptions = [
      {
        description: 'Confuses worst-case, average-case, and best-case time complexity.',
        indicators: ['time complexity is always the best case', 'o(n) means exact steps count', 'complexity only counts memory'],
      },
    ]
  } else if (/ai|machine learning|neural|deep learning|model|regression/i.test(combined)) {
    domainKeywords = ['model', 'data', 'training', 'features', 'prediction', 'supervised', 'unsupervised', 'weights', 'dataset', 'learning']
    domainMechanics = ['loss function', 'gradient descent', 'optimization', 'backpropagation', 'evaluation', 'overfitting', 'hyperparameters', 'accuracy', 'validation']
    domainExamples = ['epoch', 'learning rate', 'inputs', 'outputs', 'matrix', 'tensor', 'labels', 'vector', 'test set']
    commonMisconceptions = [
      {
        description: 'Confuses training accuracy with model generalization on unseen data (overfitting).',
        indicators: ['100% training accuracy means perfect model', 'memorizing data is optimal', 'more parameters always prevent errors'],
      },
    ]
  } else {
    // General technical domain heuristic
    const words = normConcept.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    domainKeywords = [...words, 'definition', 'core concept', 'purpose', 'primary role', 'functionality', 'system']
    domainMechanics = ['mechanism', 'how it works', 'execution', 'process', 'flow', 'structure', 'operation', 'rules', 'state']
    domainExamples = ['example', 'in practice', 'use case', 'code', 'implementation', 'instance', 'application', 'scenario']
    commonMisconceptions = [
      {
        description: `Over-simplifies ${normConcept} without addressing operational constraints or trade-offs.`,
        indicators: [`${normConcept.toLowerCase()} has no limitations`, 'works without any prerequisites', 'always suitable for every problem'],
      },
    ]
  }

  // Concept name tokens for specific targeting
  const conceptTokens = normConcept
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['and', 'the', 'for', 'with', 'core'].includes(w))

  return {
    concept: normConcept,
    question: `Explain "${normConcept}" in detail. Define its primary purpose, explain how it operates or behaves, and provide a concrete practical example or code illustration.`,
    criteria: [
      {
        id: 'definition-purpose',
        description: `Accurately defines ${normConcept} and explains its primary purpose and role.`,
        acceptedIdeas: [
          ...conceptTokens,
          ...domainKeywords,
          'purpose',
          'definition',
          'defined as',
          'is used to',
          'allows',
          'refers to',
          'primary role',
          'enables',
          'designed to',
        ],
        points: 35,
      },
      {
        id: 'mechanism-operation',
        description: `Explains the operational mechanism, execution behavior, or internal rules of ${normConcept}.`,
        acceptedIdeas: [
          ...domainMechanics,
          'how it works',
          'mechanism',
          'behavior',
          'execution',
          'process',
          'operates',
          'under the hood',
          'syntax',
          'lifecycle',
          'data flow',
          'structure',
        ],
        points: 35,
      },
      {
        id: 'example-application',
        description: `Provides a concrete code snippet, syntax demonstration, or realistic applied example.`,
        acceptedIdeas: [
          ...domainExamples,
          'for example',
          'example',
          'e.g.',
          'code',
          'such as',
          'implementation',
          'sample',
          'in practice',
          'scenario',
          'case',
        ],
        points: 30,
      },
    ],
    commonMisconceptions,
  }
}

export const conceptAliases: Record<string, string> = {
  pointer: 'Pointer Basics',
  pointers: 'Pointer Basics',
  'pointer basic': 'Pointer Basics',
  'pointer basics': 'Pointer Basics',
  'c++ pointer': 'Pointer Basics',
  'c++ pointers': 'Pointer Basics',
  'memory address': 'Memory Addresses',
  'memory addresses': 'Memory Addresses',
  dereference: 'Dereferencing',
  dereferencing: 'Dereferencing',
  'null pointer': 'Null Pointers',
  'null pointers': 'Null Pointers',
  'pointer arithmetic': 'Pointer Arithmetic',
  'pointers and arrays': 'Pointers and Arrays',
  'dynamic memory': 'Dynamic Memory',
  'smart pointer': 'Smart Pointers',
  'smart pointers': 'Smart Pointers',
  'nodes and pointers': 'Nodes and Pointers',
}

export function getAssessmentRubric(
  concept: string,
  subject?: string,
  topic?: string
): ConceptRubric {
  // 1. Direct exact key match
  if (assessmentRubrics[concept]) return assessmentRubrics[concept]

  const clean = concept.toLowerCase().trim().replace(/['’]/g, '')
  // 2. Direct alias match (handles 'Pointers' -> 'Pointer Basics')
  if (conceptAliases[clean]) return assessmentRubrics[conceptAliases[clean]]

  const target = normalizeKey(concept)
  // 3. Exact normalized key match
  for (const [key, rubric] of Object.entries(assessmentRubrics)) {
    if (normalizeKey(key) === target) return rubric
  }

  // 4. Normalized alias match
  for (const [alias, canonicalKey] of Object.entries(conceptAliases)) {
    if (normalizeKey(alias) === target) return assessmentRubrics[canonicalKey]
  }

  // 5. Token-based matching: only match static rubrics when candidate has NO incompatible qualifiers
  const targetTokens = clean.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
  const targetStem = targetTokens.map((t) => t.replace(/(s|es|ing|ed)$/, '')).join(' ')

  for (const [key, rubric] of Object.entries(assessmentRubrics)) {
    const keyClean = key.toLowerCase().replace(/['’]/g, '')
    const keyTokens = keyClean.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
    const keyStem = keyTokens.map((t) => t.replace(/(s|es|ing|ed)$/, '')).join(' ')

    // Exact stem match (e.g. 'pointers' -> 'pointer')
    if (keyStem === targetStem) return rubric
    if (keyClean === 'pointer basics' && (targetStem === 'pointer' || clean === 'pointers')) return rubric

    // If query contains multiple tokens, ensure all candidate tokens are covered
    if (targetTokens.length > 1 && keyTokens.every((kt) => targetTokens.includes(kt))) {
      return rubric
    }
  }

  // 6. Return dynamic rubric generated from curriculum context
  return buildDynamicRubric(concept, subject, topic)
}
