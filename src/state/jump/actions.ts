import { createAction } from '@reduxjs/toolkit'
import { Strategy } from './types'

export const setStrategy = createAction<Strategy>('jump/setStrategy')
export const setZapIn = createAction<boolean>('jump/setZapIn')
export const setValues = createAction<{ inputValue: string; outputValue: string }>('jump/setInputValue')
