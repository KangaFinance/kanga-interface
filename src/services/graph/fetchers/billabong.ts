import { ChainId } from '@kangafinance/sdk'
import { GRAPH_HOST } from '../constants'
import { request } from 'graphql-request'
import { billabongHistoriesQuery, billabongQuery } from '../queries/billabong'

const BILLABONG = {
  [ChainId.MAINNET]: 'matthewlilley/bar',
}

export const billabong = async (query, variables = undefined) =>
  request(`https://api.thegraph.com/subgraphs/name/${BILLABONG['1']}`, query, variables)

export const getBillabong = async (block: number) => {
  const { billabong: billabongData } = await billabong(billabongQuery, { block: block ? { number: block } : undefined })
  return billabongData
}

export const getBillabongHistory = async () => {
  const { histories } = await billabong(billabongHistoriesQuery)
  return histories
}
