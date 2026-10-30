
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
          id: 'memory-address',
          description: 'Explains that a pointer stores a memory address.',
          acceptedIdeas: [
            'memory address',
            'address of a variable',
          ],
          points: 40,
        },
        {
          id: 'pointer-declaration',
          description: 'Understands that pointers have a type and are declared using *.',
          acceptedIdeas: [
            'pointer declaration',
            'int *',
            'char *',
            'pointer variable',
          ],
          points: 30,
        },
        {
          id: 'pointer-purpose',
          description: 'Explains how pointers refer to other variables.',
          acceptedIdeas: [
            'refer to a variable',
            'access through an address',
          ],
          points: 30,
        },
      ],
      commonMisconceptions: [
        {
          description: 'Confuses a pointer with the value stored at an address.',
          indicators: [
            'pointer stores the value instead of address',
          ],
        },
        {
          description: 'Confuses the address-of operator with dereferencing.',
          indicators: [
            '& is used to get the value',
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
          description: 'Explains that a memory address identifies a memory location.',
          acceptedIdeas: [
            'location in memory',
            'memory location',
            'address of a variable',
          ],
          points: 50,
        },
        {
          id: 'address-operator',
          description: 'Understands the purpose of the & operator.',
          acceptedIdeas: [
            'address-of operator',
            'ampersand',
            'get the address',
          ],
          points: 50,
        },
      ],
      commonMisconceptions: [
        {
          description: 'Thinks a memory address is the value stored in a variable.',
          indicators: [
            'address is the value stored',
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
          description: 'Explains that dereferencing accesses the value at the pointed-to address.',
          acceptedIdeas: [
            'access the value',
            'value at the address',
            'value pointed to',
          ],
          points: 60,
        },
        {
          id: 'dereference-operator',
          description: 'Identifies * as the dereference operator.',
          acceptedIdeas: [
            'asterisk operator',
            'dereference operator',
          ],
          points: 40,
        },
      ],
      commonMisconceptions: [
        {
          description: 'Confuses dereferencing with obtaining a variable address.',
          indicators: [
            'dereferencing gets the address',
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
          description: 'Explains that a node stores data and a link to another node.',
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
          description: 'Explains that pointers store the addresses of other nodes.',
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
          description: 'Understands that nodes form a connected sequence.',
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
  
  export function getAssessmentRubric(
    concept: string,
  ): ConceptRubric | undefined {
    return assessmentRubrics[concept]
  }
  