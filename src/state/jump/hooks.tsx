import { useAppSelector } from '../hooks'
import { Token } from '@kangafinance/sdk'
import { tryParseAmount } from '../../functions'
import useStakeKangaToMobStrategy from './strategies/useStakeKangaToMobStrategy'
import { DerivedJumpState, JumpState } from './types'
import useStakeKangaToCreamStrategy from './strategies/useStakeKangaToCreamStrategy'
import useStakeKangaToCreamToMobStrategy from './strategies/useStakeKangaToCreamToMobStrategy'
import useStakeKangaToAaveStrategy from './strategies/useStakeKangaToAaveStrategy'
import { useMemo } from 'react'

export function useJumpState(): JumpState {
  return useAppSelector((state) => state.jump)
}

// Redux doesn't allow for non-serializable classes so use a derived state hook for complex values
// Derived state may not use any of the strategy hooks to avoid an infinite loop
export function useDerivedJumpState(): DerivedJumpState {
  const { inputValue, outputValue, tokens, general, ...rest } = useJumpState()

  // BalancePanel input token
  const inputToken = useMemo(
    () =>
      new Token(
        tokens.inputToken.chainId,
        tokens.inputToken.address,
        tokens.inputToken.decimals,
        tokens.inputToken.symbol
      ),
    [tokens.inputToken.address, tokens.inputToken.chainId, tokens.inputToken.decimals, tokens.inputToken.symbol]
  )

  // BalancePanel output token
  const outputToken = useMemo(
    () =>
      new Token(
        tokens.outputToken.chainId,
        tokens.outputToken.address,
        tokens.outputToken.decimals,
        tokens.outputToken.symbol
      ),
    [tokens.outputToken.address, tokens.outputToken.chainId, tokens.outputToken.decimals, tokens.outputToken.symbol]
  )

  return useMemo(
    () => ({
      ...rest,
      inputValue: tryParseAmount(inputValue, inputToken),
      outputValue: tryParseAmount(outputValue, outputToken),
      general,
      tokens: {
        inputToken,
        outputToken,
      },
    }),
    [general, inputToken, inputValue, outputToken, outputValue, rest]
  )
}

export function useSelectedJumpStrategy() {
  const { id: selectedStrategy } = useJumpState()
  const strategies = useJumpStrategies()
  return useMemo(() => strategies[selectedStrategy], [selectedStrategy, strategies])
}

// Use this hook to register all strategies
export function useJumpStrategies() {
  const stakeKangaToMobStrategy = useStakeKangaToMobStrategy()
  const stakeKangaToCreamStrategy = useStakeKangaToCreamStrategy()
  const stakeKangaToAaveStrategy = useStakeKangaToAaveStrategy()

  return useMemo(
    () => ({
      [stakeKangaToMobStrategy.id]: stakeKangaToMobStrategy,
      [stakeKangaToCreamStrategy.id]: stakeKangaToCreamStrategy,
      [stakeKangaToAaveStrategy.id]: stakeKangaToAaveStrategy,
    }),
    [stakeKangaToAaveStrategy, stakeKangaToMobStrategy, stakeKangaToCreamStrategy]
  )
}
