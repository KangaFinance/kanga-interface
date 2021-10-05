import React, { FC } from 'react'

import { KmobState } from '../../pages/tools/kmob'
import { RadioGroup } from '@headlessui/react'
import Typography from '../../components/Typography'
import { classNames } from '../../functions'

interface HeaderToggleProps {
  kmobState: KmobState
}

const HeaderToggle: FC<HeaderToggleProps> = ({ kmobState }) => {
  const { kmob, switchCurrencies } = kmobState

  return (
    <div className="flex justify-between">
      <RadioGroup
        value={kmob}
        onChange={switchCurrencies}
        className="flex flex-row bg-dark-800 rounded p-3px cursor-pointer"
      >
        <RadioGroup.Option
          value={true}
          className={({ checked }) =>
            classNames('px-8 py-2 rounded', `${checked ? 'bg-gradient-to-r from-blue to-pink' : ''}`)
          }
        >
          {({ checked }) => (
            <Typography weight={checked ? 700 : 400} className={`${checked ? 'text-high-emphesis' : 'text-secondary'}`}>
              Kmob
            </Typography>
          )}
        </RadioGroup.Option>
        <RadioGroup.Option
          value={false}
          className={({ checked }) =>
            classNames('px-8 py-2 rounded', `${checked ? 'bg-gradient-to-r from-blue to-pink' : ''}`)
          }
        >
          {({ checked }) => (
            <Typography weight={checked ? 700 : 400} className={`${checked ? 'text-high-emphesis' : 'text-secondary'}`}>
              Un-Kmob
            </Typography>
          )}
        </RadioGroup.Option>
      </RadioGroup>
      <div className="my-1.5 items-center flex border-gradient-r-blue-pink-dark-pink-red border-transparent border-solid border rounded-3xl px-4 md:px-3.5 py-1.5 md:py-0.5 text-high-emphesis text-xs font-medium md:text-base md:font-normal">
        1 xKANGA ≈ 100k KMOB
      </div>
    </div>
  )
}

export default HeaderToggle
