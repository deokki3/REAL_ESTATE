import { useQuery } from '@tanstack/react-query'
import { apiGet, type ApiMeta } from '../../lib/api'
import type { Announcement, AnnouncementDetail, AnnouncementSearchParams } from './types'

export function useAnnouncements(params: AnnouncementSearchParams) {
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: async () => {
      const { data, meta } = await apiGet<Announcement[]>('/announcements', {
        region: params.region,
        category: params.category,
        status: params.status,
        q: params.q,
        page: params.page,
        pageSize: params.pageSize,
      })
      return { items: data, meta: meta as ApiMeta | undefined }
    },
    placeholderData: (previous) => previous,
  })
}

export function useAnnouncementDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['announcement', id],
    queryFn: async () => (await apiGet<AnnouncementDetail>(`/announcements/${id}`)).data,
    enabled: id !== undefined,
  })
}
