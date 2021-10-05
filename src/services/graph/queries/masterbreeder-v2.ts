import gql from 'graphql-tag'

export const poolsV2Query = gql`
  query poolsV2Query(
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
      klpBalance
      masterBreeder {
        id
        totalAllocPoint
      }
      rewarder {
        id
        rewardToken
        rewardPerSecond
      }
    }
  }
`

export const masterBreederV2PairAddressesQuery = gql`
  query masterBreederV2PairAddresses(
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
