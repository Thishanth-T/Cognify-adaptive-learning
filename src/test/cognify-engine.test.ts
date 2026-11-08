import { describe, expect, it } from 'vitest'
import {
  computeTwin,
  planLearning,
  type HistoryEntry,
  type GraphConcept,
} from '../lib/learning/twin'
import { evaluateWithRubric } from '../lib/ai/evaluator.server'
import { isUncertainResponse } from '../data/sampleData'

const testConcepts: GraphConcept[] = [
  { id: 'pointer-basics', label: 'Pointer Basics', prerequisites: [] },
  { id: 'memory-address', label: 'Memory Addresses', prerequisites: ['pointer-basics'] },
  { id: 'dereferencing', label: 'Dereferencing', prerequisites: ['memory-address'] },
]

describe('Cognify Learning Twin Engine', () => {
  it('correctly derives mastery and unlocks dependent concepts upon reaching 60%', () => {
    // 1. Initial state: Pointer Basics available, Memory Addresses locked
    const emptyTwin = computeTwin([], testConcepts)
    const pb0 = emptyTwin.nodes.find((n) => n.id === 'pointer-basics')!
    const ma0 = emptyTwin.nodes.find((n) => n.id === 'memory-address')!

    expect(pb0.state).toBe('available')
    expect(pb0.mastery).toBeNull()
    expect(ma0.state).toBe('locked')

    // 2. Student takes Pointer Basics and scores 85%
    const history1: HistoryEntry[] = [
      {
        concept: 'Pointer Basics',
        score: 85,
        correct: true,
        status: 'correct',
        misconceptionTags: [],
        timestamp: Date.now() - 10000,
      },
    ]

    const twin1 = computeTwin(history1, testConcepts)
    const pb1 = twin1.nodes.find((n) => n.id === 'pointer-basics')!
    const ma1 = twin1.nodes.find((n) => n.id === 'memory-address')!

    expect(pb1.mastery).toBe(85)
    expect(pb1.state).toBe('mastered')
    // Memory Addresses must now be UNLOCKED (available) because its prerequisite reached >= 60%
    expect(ma1.state).toBe('available')
  })

  it('detects and aggregates recurring misconceptions across history', () => {
    const history: HistoryEntry[] = [
      {
        concept: 'Pointer Basics',
        score: 30,
        correct: false,
        status: 'incorrect',
        misconceptionTags: ['confuses pointer with stored value'],
        timestamp: Date.now() - 20000,
      },
      {
        concept: 'Dereferencing',
        score: 40,
        correct: false,
        status: 'incorrect',
        misconceptionTags: ['confuses pointer with stored value'],
        timestamp: Date.now() - 10000,
      },
    ]

    const twin = computeTwin(history, testConcepts)
    expect(twin.misconceptions.length).toBeGreaterThan(0)
    const recurring = twin.misconceptions.find((m) => m.tag === 'confuses pointer with stored value')
    expect(recurring).toBeDefined()
    expect(recurring?.count).toBe(2)
    expect(recurring?.recurring).toBe(true)
  })

  it('plans optimal next concept topologically', () => {
    const history: HistoryEntry[] = [
      {
        concept: 'Pointer Basics',
        score: 85,
        correct: true,
        status: 'correct',
        timestamp: Date.now(),
      },
    ]

    const twin = computeTwin(history, testConcepts)
    const plan = planLearning(twin, testConcepts)

    expect(plan.next).toBeDefined()
    expect(plan.next?.id).toBe('memory-address')
    expect(plan.complete).toBe(false)
  })
})

describe('Cognify Rubric & Semantic Evaluation Engine', () => {
  it('evaluates answers using comprehensive rubric criteria and assigns score', () => {
    const res = evaluateWithRubric({
      concept: 'Pointer Basics',
      question: 'What is a pointer in C++?',
      answer: 'A pointer stores the memory address of another variable and is declared using an asterisk like int *ptr.',
    })

    expect(res.status).toBe('assessed')
    expect(res.score).toBeGreaterThanOrEqual(70)
    expect(res.correct).toBe(true)
    expect(res.strengths.length).toBeGreaterThan(0)
    expect(res.misconceptions.length).toBe(0)
  })

  it('detects misconceptions in flawed explanations', () => {
    const res = evaluateWithRubric({
      concept: 'Pointer Basics',
      question: 'What is a pointer in C++?',
      answer: 'A pointer stores the value instead of address.',
    })

    expect(res.misconceptions.length).toBeGreaterThan(0)
    expect(res.misconceptions[0]).toContain('Confuses a pointer with the value')
    expect(res.correct).toBe(false)
  })

  it('accurately identifies uncertainty without scoring penalties', () => {
    expect(isUncertainResponse('I do not know')).toBe(true)
    expect(isUncertainResponse('im not sure')).toBe(true)
    expect(isUncertainResponse('I have no idea')).toBe(true)
    expect(isUncertainResponse('A pointer is a memory address')).toBe(false)
  })
})
