
import {
    validateAIAssessment,
    type ValidatedAIAssessment,
  } from './responseSchema'
  
  export type AIProviderInput = {
    concept: string
    question: string
    answer: string
  }
  
  export type AIProviderResult = ValidatedAIAssessment
  
  export interface AIProvider {
    readonly name: string
  
    evaluate(
      input: AIProviderInput,
    ): Promise<unknown>
  }
  
  const providers = new Map<string, AIProvider>()
  
  export function registerAIProvider(provider: AIProvider): void {
    providers.set(provider.name, {
      name: provider.name,
  
      async evaluate(input: AIProviderInput) {
        const rawResult = await provider.evaluate(input)
        return validateAIAssessment(rawResult)
      },
    })
  }
  
  export function getAIProvider(name: string): AIProvider {
    const provider = providers.get(name)
  
    if (!provider) {
      throw new Error(
        `AI provider "${name}" is not registered.`,
      )
    }
  
    return provider
  }
  
  export function getRegisteredProviders(): string[] {
    return Array.from(providers.keys())
  }
  