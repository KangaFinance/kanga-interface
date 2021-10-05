import { TROOP_ADDRESS, USDC_ADDRESS, WNATIVE_ADDRESS } from '@kangafinance/sdk'
import { useMobContract, useBoringHelperContract, useContract } from '../../hooks/useContract'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { BigNumber } from '@ethersproject/bignumber'


import ERC20_ABI from '../../constants/abis/erc20.json'
import { WrappedTokenInfo } from '../lists/wrappedTokenInfo'
import { e10 } from '../../functions/math'
import { easyAmount } from '../../functions/troop'
import { getAddress } from '@ethersproject/address'
import { toAmount } from '../../functions/mob'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import { useAllTokens } from '../../hooks/Tokens'
import { useSingleCallResult } from '../multicall/hooks'
import useTransactionStatus from '../../hooks/useTransactionStatus'

export interface MobBalance {
  address: string
  name: string
  symbol: string
  decimals: number
  balance: any
  mobBalance: any
  wallet: any
  mob: any
}

export function useMobBalances(): MobBalance[] {
  const { chainId, account } = useActiveWeb3React()

  const boringHelperContract = useBoringHelperContract()

  const tokens = useAllTokens()

  const weth = WNATIVE_ADDRESS[chainId]

  const tokenAddresses = Object.keys(tokens)

  const balanceData = useSingleCallResult(boringHelperContract, 'getBalances', [account, tokenAddresses])

  const uiData = useSingleCallResult(boringHelperContract, 'getUIInfo', [
    account,
    [],
    USDC_ADDRESS[chainId],
    [TROOP_ADDRESS[chainId]],
  ])

  // IERC20 token = addresses[i];
  // balances[i].totalSupply = token.totalSupply();
  // balances[i].token = token;
  // balances[i].balance = token.balanceOf(who);
  // balances[i].mobAllowance = token.allowance(who, address(mob));
  // balances[i].nonce = token.nonces(who);
  // balances[i].mobBalance = mob.balanceOf(token, who);
  // (balances[i].mobAmount, balances[i].mobShare) = mob.totals(token);
  // balances[i].rate = getETHRate(token);

  return useMemo(() => {
    if (
      uiData.loading ||
      balanceData.loading ||
      uiData.error ||
      balanceData.error ||
      !uiData.result ||
      !balanceData.result
    )
      return []
    return tokenAddresses
      .map((key: string, i: number) => {
        const token = tokens[key]

        const usd = e10(token.decimals).mulDiv(uiData.result[0].ethRate, balanceData.result[0][i].rate)

        const full = {
          ...token,
          ...balanceData.result[0][i],
          usd,
        }
        return {
          ...token,
          usd,
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          balance: token.address === weth ? uiData.result[0].ethBalance : balanceData.result[0][i].balance,
          mobBalance: balanceData.result[0][i].mobBalance,
          wallet: easyAmount(
            token.address === weth ? uiData.result[0].ethBalance : balanceData.result[0][i].balance,
            full
          ),
          mob: easyAmount(toAmount(full, balanceData.result[0][i].mobBalance), full),
        }
      })
      .filter((token) => token.balance.gt('0') || token.mobBalance.gt('0'))
  }, [
    uiData.loading,
    uiData.error,
    uiData.result,
    balanceData.loading,
    balanceData.error,
    balanceData.result,
    tokenAddresses,
    tokens,
    weth,
  ])
}

export function useMobBalance(tokenAddress: string): {
  value: BigNumber
  decimals: number
} {
  const { account } = useActiveWeb3React()

  const boringHelperContract = useBoringHelperContract()
  const mobContract = useMobContract()
  const tokenAddressChecksum = getAddress(tokenAddress)
  const tokenContract = useContract(tokenAddressChecksum ? tokenAddressChecksum : undefined, ERC20_ABI)

  const currentTransactionStatus = useTransactionStatus()

  const [balance, setBalance] = useState<any>()

  // const balanceData = useSingleCallResult(boringHelperContract, 'getBalances', [account, tokenAddresses])

  const fetchMobBalance = useCallback(async () => {
    const balances = await boringHelperContract?.getBalances(account, [tokenAddressChecksum])
    const decimals = await tokenContract?.decimals()

    const amount = BigNumber.from(balances[0].mobShare).isZero()
      ? BigNumber.from(0)
      : BigNumber.from(balances[0].mobBalance)
          .mul(BigNumber.from(balances[0].mobAmount))
          .div(BigNumber.from(balances[0].mobShare))

    setBalance({
      value: amount,
      decimals: decimals,
    })
  }, [account, tokenAddressChecksum, tokenContract, boringHelperContract])

  useEffect(() => {
    if (account && mobContract && boringHelperContract && tokenContract) {
      fetchMobBalance()
    }
  }, [account, mobContract, currentTransactionStatus, fetchMobBalance, tokenContract, boringHelperContract])

  return balance
}

export function useMobMasterContractAllowed(masterContract?: string, user?: string): boolean | undefined {
  const contract = useMobContract()

  const inputs = useMemo(() => [masterContract, user], [masterContract, user])

  const allowed = useSingleCallResult(contract, 'masterContractApproved', inputs).result

  return useMemo(() => (allowed ? allowed[0] : undefined), [allowed])
}
