import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { MobBalance, useMobBalances } from '../../state/mob/hooks'
import { KANGAMOB_ADDRESS, CurrencyAmount, Token, WNATIVE } from '@kangafinance/sdk'
import React, { useState } from 'react'
import { useFuse, useSortableData } from '../../hooks'

import Back from '../../components/Back'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Container from '../../components/Container'
import Dots from '../../components/Dots'
import Head from 'next/head'
import Image from '../../components/Image'
import Input from '../../components/Input'
import Layout from '../../layouts/Troop'
import Paper from '../../components/Paper'
import Search from '../../components/Search'
import { Transition } from '@headlessui/react'
import { WrappedTokenInfo } from '../../state/lists/wrappedTokenInfo'
import { cloudinaryLoader } from '../../functions/cloudinary'
import { formatNumber } from '../../functions/format'
import { t } from '@lingui/macro'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import useMob from '../../hooks/useMob'
import { useLingui } from '@lingui/react'

function Balances() {
  const { i18n } = useLingui()
  const balances = useMobBalances()

  // Search Setup
  const options = { keys: ['symbol', 'name'], threshold: 0.1 }
  const { result, search, term } = useFuse({
    data: balances && balances.length > 0 ? balances : [],
    options,
  })

  // Sorting Setup
  const { items, requestSort, sortConfig } = useSortableData(result)

  return (
    <Container id="balances-page" className="py-4 md:py-8 lg:py-12" maxWidth="2xl">
      <Head>
        <title>Balances | Kanga</title>
        <meta key="description" name="description" content="" />
      </Head>
      <Card
        className="h-full bg-dark-900"
        header={
          <Card.Header className="flex items-center justify-between bg-dark-800">
            <div className="flex flex-col items-center justify-between w-full md:flex-row">
              <div className="flex items-baseline">
                <div className="mr-4 text-3xl text-high-emphesis">{i18n._(t`Mob`)}</div>
              </div>
              <div className="flex justify-end w-2/3 py-4 md:py-0">
                <Search search={search} term={term} />
              </div>
            </div>
          </Card.Header>
        }
      >
        <div className="grid grid-flow-row gap-4 auto-rows-max">
          <div className="grid grid-cols-3 px-4 text-sm select-none text-secondary">
            <div>{i18n._(t`Token`)}</div>
            <div className="text-right">{i18n._(t`Wallet`)}</div>
            <div className="text-right">{i18n._(t`Mob`)}</div>
          </div>
          {items &&
            items.length > 0 &&
            items.map((token, i: number) => <TokenBalance key={token.address + '_' + i} token={token} />)}
        </div>
      </Card>
    </Container>
  )
}

const BalancesLayout = ({ children }) => {
  const { i18n } = useLingui()
  return (
    <Layout
      left={
        <Card
          className="h-full bg-dark-900"
          backgroundImage="mob-illustration.png"
          title={i18n._(t`Deposit tokens into Mob for all the yields`)}
          description={i18n._(
            t`Mob provides extra yield on deposits with flash lending, strategies, and fixed, low-gas transfers among integrated dapps, like Troop markets`
          )}
        />
      }
    >
      {children}
    </Layout>
  )
}

Balances.Layout = BalancesLayout

export default Balances

const TokenBalance = ({ token }: { token: MobBalance & WrappedTokenInfo }) => {
  const [expand, setExpand] = useState<boolean>(false)
  return (
    <Paper className="space-y-4">
      <div
        className="grid grid-cols-3 px-4 py-4 text-sm rounded cursor-pointer select-none bg-dark-800"
        onClick={() => setExpand(!expand)}
      >
        <div className="flex items-center space-x-3">
          <Image
            loader={undefined}
            height={56}
            width={56}
            src={token.tokenInfo.logoURI}
            className="w-10 mr-4 rounded-lg sm:w-14"
            alt={token.tokenInfo.symbol}
          />
          <div>{token && token.tokenInfo.symbol}</div>
        </div>
        <div className="flex items-center justify-end">
          <div>
            <div className="text-right">{formatNumber(token.wallet.string)} </div>
            <div className="text-right text-secondary">{formatNumber(token.wallet.usd, true)}</div>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <div>
            <div className="text-right">{formatNumber(token.mob.string)} </div>
            <div className="text-right text-secondary">{formatNumber(token.mob.usd, true)}</div>
          </div>
        </div>
      </div>
      <Transition
        show={expand}
        enter="transition-opacity duration-75"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="grid grid-cols-2 gap-4 ">
          <div className="col-span-2 p-4 text-center rounded md:col-span-1 bg-dark-800">
            <Deposit token={token} />
          </div>
          <div className="col-span-2 p-4 text-center rounded md:col-span-1 bg-dark-800">
            <Withdraw token={token} />
          </div>
        </div>
      </Transition>
    </Paper>
  )
}

export function Deposit({ token }: { token: MobBalance & WrappedTokenInfo }): JSX.Element {
  const { i18n } = useLingui()
  const { account, chainId } = useActiveWeb3React()

  const { deposit } = useMob()

  const [value, setValue] = useState('')

  const [pendingTx, setPendingTx] = useState(false)

  const [approvalState, approve] = useApproveCallback(
    CurrencyAmount.fromRawAmount(
      new Token(chainId, token.address, token.tokenInfo.decimals, token.tokenInfo.symbol, token.tokenInfo.name),
      value.toBigNumber(token.tokenInfo.decimals).toString()
    ),
    chainId && KANGAMOB_ADDRESS[chainId]
  )

  const showApprove =
    chainId &&
    token.address !== WNATIVE[chainId].address &&
    (approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING)

  return (
    <>
      {account && (
        <div className="pr-4 mb-2 text-sm text-right cursor-pointer text-secondary">
          {i18n._(t`Wallet Balance`)}: {formatNumber(token.balance.toFixed(token.tokenInfo.decimals))}
        </div>
      )}
      <div className="relative flex items-center w-full mb-4">
        <Input.Numeric
          className="w-full p-3 rounded bg-dark-700 focus:ring focus:ring-blue"
          value={value}
          onUserInput={(value) => {
            setValue(value)
          }}
        />
        {account && (
          <Button
            variant="outlined"
            color="blue"
            size="xs"
            onClick={() => {
              setValue(token.balance.toFixed(token.tokenInfo.decimals))
            }}
            className="absolute right-4 focus:ring focus:ring-blue"
          >
            {i18n._(t`MAX`)}
          </Button>
        )}
      </div>

      {showApprove && (
        <Button color="blue" disabled={approvalState === ApprovalState.PENDING} onClick={approve}>
          {approvalState === ApprovalState.PENDING ? <Dots>{i18n._(t`Approving`)} </Dots> : i18n._(t`Approve`)}
        </Button>
      )}
      {!showApprove && (
        <Button
          color="blue"
          disabled={pendingTx || !token || token.balance.lte(0)}
          onClick={async () => {
            setPendingTx(true)
            await deposit(token.address, value.toBigNumber(token.tokenInfo.decimals))
            setPendingTx(false)
          }}
        >
          {i18n._(t`Deposit`)}
        </Button>
      )}
    </>
  )
}

function Withdraw({ token }: { token: MobBalance & WrappedTokenInfo }): JSX.Element {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()

  const { withdraw } = useMob()

  const [pendingTx, setPendingTx] = useState(false)

  const [value, setValue] = useState('')

  return (
    <>
      {account && (
        <div className="pr-4 mb-2 text-sm text-right cursor-pointer text-secondary">
          {i18n._(
            t`Mob Balance: ${formatNumber(token.mobBalance ? token.mobBalance.toFixed(token.tokenInfo.decimals) : 0)}`
          )}
        </div>
      )}
      <div className="relative flex items-center w-full mb-4">
        <Input.Numeric
          className="w-full p-3 rounded bg-dark-700 focus:ring focus:ring-pink"
          value={value}
          onUserInput={(value) => {
            setValue(value)
          }}
        />
        {account && (
          <Button
            variant="outlined"
            color="pink"
            size="xs"
            onClick={() => {
              setValue(token.mobBalance.toFixed(token.tokenInfo.decimals))
            }}
            className="absolute right-4 focus:ring focus:ring-pink"
          >
            {i18n._(t`MAX`)}
          </Button>
        )}
      </div>
      <Button
        color="pink"
        disabled={pendingTx || !token || token.mobBalance.lte(0)}
        onClick={async () => {
          setPendingTx(true)
          await withdraw(token.address, value.toBigNumber(token.tokenInfo.decimals))
          setPendingTx(false)
        }}
      >
        {i18n._(t`Withdraw`)}
      </Button>
    </>
  )
}
