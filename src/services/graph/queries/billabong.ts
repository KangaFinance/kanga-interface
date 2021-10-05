import gql from 'graphql-tag'

export const billabongQuery = gql`
  query barQuery($id: String! = "0x8798249c2e607446efb7ad49ec89dd1865ff4272", $block: Block_height) {
    bar(id: $id, block: $block) {
      id
      totalSupply
      ratio
      xKangaMinted
      xKangaBurned
      kangaStaked
      kangaStakedUSD
      kangaHarvested
      kangaHarvestedUSD
      xKangaAge
      xKangaAgeDestroyed
      # histories(first: 1000) {
      #   id
      #   date
      #   timeframe
      #   kangaStaked
      #   kangaStakedUSD
      #   kangaHarvested
      #   kangaHarvestedUSD
      #   xKangaAge
      #   xKangaAgeDestroyed
      #   xKangaMinted
      #   xKangaBurned
      #   xKangaSupply
      #   ratio
      # }
    }
  }
`

export const billabongHistoriesQuery = gql`
  query barHistoriesQuery {
    histories(first: 1000) {
      id
      date
      timeframe
      kangaStaked
      kangaStakedUSD
      kangaHarvested
      kangaHarvestedUSD
      xKangaAge
      xKangaAgeDestroyed
      xKangaMinted
      xKangaBurned
      xKangaSupply
      ratio
    }
  }
`

export const billabongUserQuery = gql`
  query barUserQuery($id: String!) {
    user(id: $id) {
      id
      bar {
        totalSupply
        kangaStaked
      }
      xKanga
      kangaStaked
      kangaStakedUSD
      kangaHarvested
      kangaHarvestedUSD
      xKangaIn
      xKangaOut
      xKangaOffset
      xKangaMinted
      xKangaBurned
      kangaIn
      kangaOut
      usdIn
      usdOut
      createdAt
      createdAtBlock
    }
  }
`
