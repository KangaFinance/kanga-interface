import { Currency, CurrencyAmount, FACTORY_ADDRESS, Pair, computePairAddress } from '@kangafinance/sdk'

import IUniswapV2PairABI from '@kangafinance/core/abi/IUniswapV2Pair.json'
import { Interface } from '@ethersproject/abi'
import { useMemo } from 'react'
import { useMultipleContractSingleData } from '../state/multicall/hooks'

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function useV2Pairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  // debugger
  // console.log("Hello logger")
  // console.log(`currencies: ${JSON.stringify(currencies)}`)
  const tokens = useMemo(
    () => currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]),
    [currencies]
  )
  // debugger

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA &&
          tokenB &&
          tokenA.chainId === tokenB.chainId &&
          !tokenA.equals(tokenB) &&
          FACTORY_ADDRESS[tokenA.chainId]
          ? computePairAddress({
              factoryAddress: FACTORY_ADDRESS[tokenA.chainId],
              tokenA,
              tokenB,
            })
          : undefined
      }),
    [tokens]
  )
  // console.log(`useV2PairsPairAddresses: ${JSON.stringify(pairAddresses)}`)
  // debugger

  //TODO - Why is this returning loading
  // useV2PairsResults: [{"valid":true,"loading":true,"syncing":true,"error":false}]
  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')
  // console.log(`useV2PairsResults: ${JSON.stringify(results)}`)

  // debugger

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      // console.log(`useMemoResult: ${JSON.stringify(result)}`)
      // console.log(`useMemoReserves: ${JSON.stringify(reserves)}`)

      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      // debugger
      return [
        PairState.EXISTS,
        new Pair(
          CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
          CurrencyAmount.fromRawAmount(token1, reserve1.toString())
        ),
      ]
    })
  }, [results, tokens])
}

export function useV2Pair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  //console.log(`tokenA: ${JSON.stringify(tokenA)}`)
  //console.log(`tokenB: ${JSON.stringify(tokenB)}`)
  const inputs: [[Currency | undefined, Currency | undefined]] = useMemo(() => [[tokenA, tokenB]], [tokenA, tokenB])
  // debugger
  //console.log(`useV2Pairs inputs: ${JSON.stringify(inputs)}`)
  //console.log(`useV2Pairs inputs[0]: ${JSON.stringify(inputs[0])}`)
  return useV2Pairs(inputs)[0]
}
