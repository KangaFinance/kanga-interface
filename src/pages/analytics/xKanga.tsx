import { ChainId, KANGA_ADDRESS } from '@kangafinance/sdk'
import React, { useMemo } from 'react'
import ScrollableGraph from '../../components/ScrollableGraph'
import AnalyticsContainer from '../../features/analytics/AnalyticsContainer'
import Background from '../../features/analytics/Background'
import InfoCard from '../../features/analytics/Billabong/InfoCard'
import { classNames, formatNumber, formatPercent } from '../../functions'
import { aprToApy } from '../../functions/convert/apyApr'
import {
  useBlock,
  useDayData,
  useEthPrice,
  useFactory,
  useNativePrice,
  useTokenDayData,
  useTokens,
} from '../../services/graph'
import { useBillabong, useBillabongHistory } from '../../services/graph/hooks/billabong'
import ColoredNumber from '../../features/analytics/ColoredNumber'
import { XKANGA } from '../../config/tokens'

export default function XKanga() {
  const block1d = useBlock({ daysAgo: 1, chainId: ChainId.MAINNET })

  const exchange = useFactory({ chainId: ChainId.MAINNET })
  const exchange1d = useFactory({ block: block1d, chainId: ChainId.MAINNET })

  const dayData = useDayData({ chainId: ChainId.MAINNET })

  const ethPrice = useNativePrice({ chainId: ChainId.MAINNET })
  const ethPrice1d = useNativePrice({ block: block1d, chainId: ChainId.MAINNET, shouldFetch: !!block1d })

  const xKanga = useTokens({ chainId: ChainId.MAINNET, subset: [XKANGA.address] })?.[0]
  const xKanga1d = useTokens({ block: block1d, chainId: ChainId.MAINNET, subset: [XKANGA.address] })?.[0]
  const kangaDayData = useTokenDayData({ token: KANGA_ADDRESS['1'], chainId: ChainId.MAINNET })

  const billabong = useBillabong()
  const billabong1d = useBillabong({ block: block1d, shouldFetch: !!block1d })
  const billabongHistory = useBillabongHistory()

  const [xKangaPrice, xKangaMarketcap] = [
    xKanga?.derivedETH * ethPrice,
    xKanga?.derivedETH * ethPrice * billabong?.totalSupply,
  ]

  const [xKangaPrice1d, xKangaMarketcap1d] = [
    xKanga1d?.derivedETH * ethPrice1d,
    xKanga1d?.derivedETH * ethPrice1d * billabong1d?.totalSupply,
  ]

  const data = useMemo(
    () =>
      billabongHistory && dayData && kangaDayData && billabong
        ? billabongHistory.map((billabongDay) => {
            const exchangeDay = dayData.find((day) => day.date === billabongDay.date)
            const kangaDay = kangaDayData.find((day) => day.date === billabongDay.date)

            const totalKangaStakedUSD = billabongDay.xKangaSupply * billabongDay.ratio * kangaDay.priceUSD

            const APR =
              totalKangaStakedUSD !== 0 ? ((exchangeDay.volumeUSD * 0.0005 * 365) / totalKangaStakedUSD) * 100 : 0

            return {
              APR: APR,
              APY: aprToApy(APR, 365),
              xKangaSupply: billabongDay.xKangaSupply,
              date: billabongDay.date,
              feesReceived: exchangeDay.volumeUSD * 0.0005,
              kangaStakedUSD: billabongDay.kangaStakedUSD,
              kangaHarvestedUSD: billabongDay.kangaHarvestedUSD,
            }
          })
        : [],
    [billabongHistory, dayData, kangaDayData, billabong]
  )

  const APY1d = aprToApy(
    (((exchange?.volumeUSD - exchange1d?.volumeUSD) * 0.0005 * 365.25) / (billabong?.totalSupply * xKangaPrice)) *
      100 ?? 0
  )
  const APY1w = aprToApy(data.slice(-7).reduce((acc, day) => (acc += day.APY), 0) / 7)

  const graphs = useMemo(
    () => [
      {
        labels: ['APY', 'APR'],
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.APY,
          })),
          data.map((d) => ({
            date: d.date * 1000,
            value: d.APR,
          })),
        ],
      },
      {
        title: 'Fees received (USD)',
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.feesReceived,
          })),
        ],
      },
      {
        labels: ['Kanga Staked (USD)', 'Kanga Harvested (USD)'],
        note: '/ day',
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.kangaStakedUSD,
          })),
          data.map((d) => ({
            date: d.date * 1000,
            value: d.kangaHarvestedUSD,
          })),
        ],
      },
      {
        title: 'xKanga Total Supply',
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.xKangaSupply,
          })),
        ],
      },
    ],
    [data]
  )

  return (
    <AnalyticsContainer>
      <Background background="bar">
        <div className="grid items-center justify-between grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
          <div className="space-y-5">
            <div className="text-3xl font-bold text-high-emphesis">xKanga</div>
            <div>Find out all about xKanga here.</div>
          </div>
          <div className="flex space-x-12">
            <div className="flex flex-col">
              <div>Price</div>
              <div className="flex items-center space-x-2">
                <div className="text-lg font-medium text-high-emphesis">{formatNumber(xKangaPrice ?? 0, true)}</div>
                <ColoredNumber number={(xKangaPrice / xKangaPrice1d) * 100 - 100} percent={true} />
              </div>
            </div>
            <div className="flex flex-col">
              <div>Market Cap</div>
              <div className="flex items-center space-x-2">
                <div className="text-lg font-medium text-high-emphesis">
                  {formatNumber(xKangaMarketcap ?? 0, true, false)}
                </div>
                <ColoredNumber number={(xKangaMarketcap / xKangaMarketcap1d) * 100 - 100} percent={true} />
              </div>
            </div>
          </div>
        </div>
      </Background>
      <div className="pt-4 space-y-5 lg:px-14">
        <div className="flex flex-row space-x-4 overflow-auto">
          <InfoCard text="APY (Last 24 Hours)" number={formatPercent(APY1d)} />
          <InfoCard text="APY (Last 7 Days)" number={formatPercent(APY1w)} />
          <InfoCard text="xKANGA Supply" number={formatNumber(billabong?.totalSupply)} />
          <InfoCard text="xKANGA : KANGA" number={Number(billabong?.ratio ?? 0)?.toFixed(4)} />
        </div>
        <div className="space-y-4">
          {graphs.map((graph, i) => (
            <div
              className={classNames(
                graph.data[0].length === 0 && 'hidden',
                'p-1 rounded bg-dark-900 border border-dark-700'
              )}
              key={i}
            >
              <div className="w-full h-96">
                <ScrollableGraph
                  labels={graph.labels}
                  title={graph.title}
                  note={graph.note}
                  data={graph.data}
                  margin={{ top: 64, right: 32, bottom: 16, left: 64 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsContainer>
  )
}
