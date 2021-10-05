import { CRXKANGA, KANGA, XKANGA } from '../../../config/tokens'
import { ChainId, CurrencyAmount, KANGA_ADDRESS, Token } from '@kangafinance/sdk'
import { StrategyGeneralInfo, StrategyHook, StrategyTokenDefinitions } from '../types'
import { useActiveWeb3React, useApproveCallback, useJumpContract, useZenkoContract } from '../../../hooks'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { I18n } from '@lingui/core'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../../functions'
import useBaseStrategy from './useBaseStrategy'
import { useDerivedJumpState } from '../hooks'
import { useLingui } from '@lingui/react'
import { useTokenBalances } from '../../wallet/hooks'

export const GENERAL = (i18n: I18n): StrategyGeneralInfo => ({
  name: i18n._(t`KANGA → Cream`),
  steps: [i18n._(t`KANGA`), i18n._(t`xKANGA`), i18n._(t`Cream`)],
  zapMethod: 'stakeKangaToCream',
  unzapMethod: 'unstakeKangaFromCream',
  description: i18n._(
    t`Stake KANGA for xKANGA and deposit into Cream in one click. xKANGA in Cream (crXKANGA) can be lent or used as collateral for borrowing.`
  ),
  inputSymbol: i18n._(t`KANGA`),
  outputSymbol: i18n._(t`xKANGA in Cream`),
})

export const tokenDefinitions: StrategyTokenDefinitions = {
  inputToken: {
    chainId: ChainId.MAINNET,
    address: KANGA_ADDRESS[ChainId.MAINNET],
    decimals: 18,
    symbol: 'KANGA',
  },
  outputToken: {
    chainId: ChainId.MAINNET,
    address: '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272',
    decimals: 18,
    symbol: 'XKANGA',
  },
}

const useStakeKangaToCreamStrategy = (): StrategyHook => {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const { zapIn, inputValue } = useDerivedJumpState()
  const zenkoContract = useZenkoContract()
  const jumpContract = useJumpContract()
  const balances = useTokenBalances(account, [KANGA[ChainId.MAINNET], CRXKANGA])
  const cTokenAmountRef = useRef<CurrencyAmount<Token>>(null)
  const approveAmount = useMemo(() => (zapIn ? inputValue : cTokenAmountRef.current), [inputValue, zapIn])

  // Override approveCallback for this strategy as we need to approve CRXKANGA on zapOut
  const approveCallback = useApproveCallback(approveAmount, jumpContract?.address)
  const general = useMemo(() => GENERAL(i18n), [i18n])
  const { execute, setBalances, ...baseStrategy } = useBaseStrategy({
    id: 'stakeKangaToCreamStrategy',
    general,
    tokenDefinitions,
  })

  const toCTokenAmount = useCallback(
    async (val: CurrencyAmount<Token>) => {
      if (!zenkoContract || !val) return null

      const bal = await zenkoContract.toCtoken(CRXKANGA.address, val.quotient.toString())
      return CurrencyAmount.fromRawAmount(CRXKANGA, bal.toString())
    },
    [zenkoContract]
  )

  // Run before executing transaction creation by transforming from xKANGA value to crXKANGA value
  // As you will be spending crXKANGA when unzapping from this strategy
  const preExecute = useCallback(
    async (val: CurrencyAmount<Token>) => {
      if (zapIn) return execute(val)
      return execute(await toCTokenAmount(val))
    },
    [execute, toCTokenAmount, zapIn]
  )

  useEffect(() => {
    toCTokenAmount(inputValue).then((val) => (cTokenAmountRef.current = val))
  }, [inputValue, toCTokenAmount])

  useEffect(() => {
    if (!zenkoContract || !balances) return

    const main = async () => {
      if (!balances[CRXKANGA.address]) return tryParseAmount('0', XKANGA)
      const bal = await zenkoContract.fromCtoken(
        CRXKANGA.address,
        balances[CRXKANGA.address].toFixed().toBigNumber(CRXKANGA.decimals).toString()
      )
      setBalances({
        inputTokenBalance: balances[KANGA[ChainId.MAINNET].address],
        outputTokenBalance: CurrencyAmount.fromRawAmount(XKANGA, bal.toString()),
      })
    }

    main()
  }, [balances, setBalances, zenkoContract])

  return useMemo(
    () => ({
      ...baseStrategy,
      approveCallback: [...approveCallback, approveAmount],
      setBalances,
      execute: preExecute,
    }),
    [approveAmount, approveCallback, baseStrategy, preExecute, setBalances]
  )
}

export default useStakeKangaToCreamStrategy
