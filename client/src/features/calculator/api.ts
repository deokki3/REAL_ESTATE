import { useMutation } from '@tanstack/react-query'
import { apiPost } from '../../lib/api'
import type {
  LeaseCalculationInput,
  LeaseCalculationResult,
  SaleCalculationInput,
  SaleCalculationResult,
} from './types'

export function useCalculateLeasePlan() {
  return useMutation({
    mutationFn: async (input: LeaseCalculationInput) =>
      (await apiPost<LeaseCalculationResult>('/calculator/lease', input)).data,
  })
}

export function useCalculateSalePlan() {
  return useMutation({
    mutationFn: async (input: SaleCalculationInput) =>
      (await apiPost<SaleCalculationResult>('/calculator/sale', input)).data,
  })
}
