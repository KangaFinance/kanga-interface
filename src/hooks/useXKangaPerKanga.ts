import { request } from 'graphql-request'
import useSWR from 'swr'

const QUERY = `{
    billabong(id: "0x8798249c2e607446efb7ad49ec89dd1865ff4272") {
      ratio
    }
}`

const fetcher = (query) => request('https://api.thegraph.com/subgraphs/name/matthewlilley/billabong', query)

// Returns ratio of XKanga:Kanga
export default function useKangaPerXKanga(parse = true) {
  const { data } = useSWR(QUERY, fetcher)
  return parseFloat(data?.billabong?.ratio)
}
