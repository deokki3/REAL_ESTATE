import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'

/** 서버 modules/health/health.service.ts 의 HealthStatus 와 손으로 맞춘 타입. */
export interface HealthStatus {
  status: 'ok'
  env: string
  uptimeSec: number
  db: 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'unknown'
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => (await apiGet<HealthStatus>('/health')).data,
    refetchInterval: 5000,
  })
}
