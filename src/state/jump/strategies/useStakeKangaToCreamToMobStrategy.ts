import { CRXKANGA, KANGA } from '../../../config/tokens'
import { ChainId, KANGA_ADDRESS, Token } from '@kangafinance/sdk'
import { StrategyGeneralInfo, StrategyHook, StrategyTokenDefinitions } from '../types'
import { e10, tryParseAmount } from '../../../functions'
import { useActiveWeb3React, useZenkoContract } from '../../../hooks'
import { useCallback, useEffect, useMemo } from 'react'

import { BigNumber } from '@ethersproject/bignumber'


import { I18n } from '@lingui/core'
import { t } from '@lingui/macro'
import useBaseStrategy from './useBaseStrategy'
import { useMobBalance } from '../../mob/hooks'
import useMobTrait from '../traits/useMobTrait'
import { useLingui } from '@lingui/react'
import useKangaPerXKanga from '../../../hooks/useXKangaPerKanga'
import { useTokenBalances } from '../../wallet/hooks'

export const GENERAL = (i18n: I18n): StrategyGeneralInfo => ({
  name: i18n._(t`Cream → Mob`),
  steps: [i18n._(t`KANGA`), i18n._(t`crXKANGA`), i18n._(t`Mob`)],
  zapMethod: 'stakeKangaToCreamToMob',
  unzapMethod: 'unstakeKangaFromCreamFromMob',
  description: i18n._(t`Stake KANGA for xKANGA into Cream and deposit crXKANGA into Mob in one click.`),
  inputSymbol: i18n._(t`KANGA`),
  outputSymbol: i18n._(t`crXKANGA in Mob`),
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
    address: '0x228619CCa194Fbe3Ebeb2f835eC1eA5080DaFbb2',
    decimals: 8,
    symbol: 'crXKANGA',
  },
}

const useStakeKangaToCreamToMobStrategy = (): StrategyHook => {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const zenkoContract = useZenkoContract()
  const balances = useTokenBalances(account, [KANGA[ChainId.MAINNET]])
  const kangaPerXKanga = useKangaPerXKanga(true)
  const crxKangaMobBalance = useMobBalance(CRXKANGA.address)

  // Strategy ends in Mob so use BaseMob strategy
  const general = useMemo(() => GENERAL(i18n), [i18n])
  const baseStrategy = useBaseStrategy({
    id: 'stakeKangaToCreamToMobStrategy',
    general,
    tokenDefinitions,
  })

  // Add in Mob trait as output is in Mob
  const { setBalances, calculateOutputFromInput: _, ...strategy } = useMobTrait(baseStrategy)

  useEffect(() => {
    if (!balances) return

    setBalances({
      inputTokenBalance: balances[KANGA[ChainId.MAINNET].address],
      outputTokenBalance: tryParseAmount(crxKangaMobBalance?.value?.toFixed(8) || '0', CRXKANGA),
    })
  }, [balances, setBalances, crxKangaMobBalance?.value])

  const calculateOutputFromInput = useCallback(
    async (zapIn: boolean, inputValue: string, inputToken: Token, outputToken: Token) => {
      if (!kangaPerXKanga || !inputValue || !zenkoContract) return null

      if (zapIn) {
        const value = inputValue.toBigNumber(18).mulDiv(e10(18), kangaPerXKanga.toString().toBigNumber(18)).toString()
        const cValue = await zenkoContract.toCtoken(CRXKANGA.address, value)
        return cValue.toFixed(outputToken.decimals)
      } else {
        const cValue = await zenkoContract.fromCtoken(CRXKANGA.address, inputValue.toBigNumber(inputToken.decimals))
        const value = BigNumber.from(cValue).mulDiv(kangaPerXKanga.toString().toBigNumber(18), e10(18))
        return value.toFixed(outputToken.decimals)
      }
    },
    [kangaPerXKanga, zenkoContract]
  )

  return useMemo(
    () => ({
      ...strategy,
      setBalances,
      calculateOutputFromInput,
    }),
    [strategy, calculateOutputFromInput, setBalances]
  )
}

export default useStakeKangaToCreamToMobStrategy
