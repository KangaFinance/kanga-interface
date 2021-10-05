import { BigNumber } from '@ethersproject/bignumber'



export function toAmount(token, shares: BigNumber): BigNumber {
  return shares.mulDiv(token.mobAmount, token.mobShare)
}

export function toShare(token, amount: BigNumber): BigNumber {
  return amount.mulDiv(token.mobShare, token.mobAmount)
}
