import { Field, KmobState } from '../../pages/tools/kmob'
import React, { FC } from 'react'
import { KANGA, XKANGA } from '../../config/tokens'

import { ChainId } from '@kangafinance/sdk'
import Image from 'next/image'
import Input from '../../components/Input'
import Typography from '../../components/Typography'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../functions'
import { useActiveWeb3React } from '../../hooks'
import { useLingui } from '@lingui/react'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useUSDCValue } from '../../hooks/useUSDCPrice'

interface CurrencyInputPanelProps {
  field: Field
  kmobState: KmobState
  showMax: boolean
}

const CurrencyInputPanel: FC<CurrencyInputPanelProps> = ({ field, kmobState, showMax }) => {
  const { currencies, handleInput, setCurrency, fields } = kmobState

  const { account } = useActiveWeb3React()
  const { i18n } = useLingui()
  const currency = currencies[field]
  const balance = useTokenBalance(account, currency)
  const inputUSDCValue = useUSDCValue(tryParseAmount(fields[field], currencies[field]))
  const balanceUSDCValue = useUSDCValue(balance)

  return (
    <>
      <div className="bg-dark-800 rounded">
        <div className="p-5 flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
          <div className="flex w-full sm:w-2/5 items-center">
            <div className="flex gap-4 items-center">
              <Image
                src={
                  currency === KANGA[ChainId.MAINNET]
                    ? '/images/tokens/kanga-square.jpg'
                    : currency === XKANGA
                    ? '/images/tokens/xkanga-square.jpg'
                    : '/images/tokens/nyan-square.jpg'
                }
                alt="KANGA"
                width="62px"
                height="62px"
                objectFit="contain"
                className="rounded-full"
              />
              <div className="flex flex-col items-start">
                <Typography variant="h3" className="text-high-emphesis leading-6" weight={700}>
                  {currency?.symbol}
                </Typography>
                {(currency === KANGA[ChainId.MAINNET] || currency === XKANGA) && (
                  <Typography
                    variant="xs"
                    className="underline text-blue cursor-pointer"
                    onClick={() => setCurrency(currency === XKANGA ? KANGA[ChainId.MAINNET] : XKANGA, field)}
                  >
                    {currencies[field] === KANGA[ChainId.MAINNET] ? i18n._(t`Use xKANGA`) : i18n._(t`Use KANGA`)}
                  </Typography>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center w-full px-3 py-2 rounded bg-dark-900 sm:w-3/5 justify-between">
            <div className="flex flex-col items-start">
              <div className="w-full">
                <Input.Numeric
                  className="w-full bg-transparent text-2xl leading-4"
                  id="token-amount-input"
                  value={fields[field]}
                  onUserInput={(val) => handleInput(val, field)}
                />
              </div>
              {inputUSDCValue && (
                <div className="text-xs font-medium text-low-emphesis">
                  ≈ {inputUSDCValue?.toSignificant(6, { groupSeparator: ',' })} USDC
                </div>
              )}
            </div>

            {showMax && (
              <span
                onClick={() => handleInput(balance?.toExact(), field)}
                className="uppercase border border-blue bg-blue text-blue bg-opacity-30 border-opacity-50 py-1 px-2 text-sm rounded-3xl flex items-center justify-center cursor-pointer hover:border-opacity-100"
              >
                {i18n._(t`Max`)}
              </span>
            )}
          </div>
        </div>
        <div className="bg-dark-700 rounded-b flex justify-end px-5 py-1.5 gap-2">
          <Typography
            variant="xs"
            component="span"
            onClick={() => handleInput(balance?.toExact(), field)}
            className="cursor-pointer text-primary"
          >
            Balance: {balance?.toSignificant(6, { groupSeparator: ',' }) || '0'} {currency?.symbol}
          </Typography>
          {balanceUSDCValue && (
            <>
              <Typography variant="xs" component="span" className="text-pr]">
                {' ≈ '}
              </Typography>
              <Typography variant="xs" component="span" className="text-secondary">
                ${balanceUSDCValue?.toSignificant(6, { groupSeparator: ',' })} USDC
              </Typography>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default CurrencyInputPanel
