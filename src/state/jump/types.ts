import { ChainId, CurrencyAmount, Token } from '@kangafinance/sdk'
import { BaseStrategyWithMobTraitHook } from './traits/useMobTrait'
import { BaseStrategyWithHasPermitTokenHook } from './traits/useHasPermitTokenTrait'
import { BaseStrategyHook } from './strategies/useBaseStrategy'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export interface Strategy {
  id: string
  general: StrategyGeneralInfo
  tokenDefinitions: StrategyTokenDefinitions
}

export interface StrategyGeneralInfo {
  name: string
  steps: string[]
  zapMethod: string
  unzapMethod: string
  description: string
  inputSymbol: string
  outputSymbol: string
}

export interface StrategyTokenDefinitions {
  inputToken: StrategyToken
  outputToken: StrategyToken
}

export interface StrategyToken {
  chainId: ChainId
  address: string
  decimals: number
  symbol: string
}

export interface StrategyBalances {
  inputTokenBalance: CurrencyAmount<Token>
  outputTokenBalance: CurrencyAmount<Token>
}

export type StrategyHook = BaseStrategyHook | BaseStrategyWithMobTraitHook | BaseStrategyWithHasPermitTokenHook

// --------------------------------
// STATE
// --------------------------------
export interface JumpState {
  id: string
  zapIn: boolean
  inputValue: string
  outputValue: string
  general: StrategyGeneralInfo
  tokens: StrategyTokenDefinitions
}

export interface DerivedJumpState extends Omit<JumpState, 'inputValue' | 'outputValue' | 'tokens'> {
  inputValue: CurrencyAmount<Token>
  outputValue: CurrencyAmount<Token>
  tokens: {
    inputToken: Token
    outputToken: Token
  }
}
