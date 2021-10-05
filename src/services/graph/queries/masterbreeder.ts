import gql from 'graphql-tag'

export const poolsQuery = gql`
  query poolsQuery(
    $first: Int! = 1000
    $skip: Int! = 0
    $orderBy: String! = "id"
    $orderDirection: String! = "desc"
    $where: Pool_filter! = { allocPoint_gt: 0, accKangaPerShare_gt: 0 }
  ) {
    pools(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
      id
      pair
      allocPoint
      lastRewardBlock
      accKangaPerShare
      balance
      userCount
      owner {
        id
        kangaPerBlock
        totalAllocPoint
      }
    }
  }
`

export const masterBreederV1PairAddressesQuery = gql`
  query masterBreederV1PairAddresses(
    $first: Int! = 1000
    $skip: Int! = 0
    $orderBy: String! = "id"
    $orderDirection: String! = "desc"
    $where: Pool_filter! = { allocPoint_gt: 0, accKangaPerShare_gt: 0 }
  ) {
    pools(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
      id
      allocPoint
      accKangaPerShare
      pair {
        id
      }
    }
  }
`

export const masterBreederV1TotalAllocPointQuery = gql`
  query masterBreederV1TotalAllocPoint($id: String! = "0xc2edad668740f1aa35e4d8f227fb8e17dca888cd") {
    masterBreeder(id: $id) {
      id
      totalAllocPoint
    }
  }
`

export const masterBreederV1KangaPerBlockQuery = gql`
  query masterBreederV1KangaPerBlock($id: String! = "0xc2edad668740f1aa35e4d8f227fb8e17dca888cd") {
    masterBreeder(id: $id) {
      id
      kangaPerBlock
    }
  }
`
