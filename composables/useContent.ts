import { useFetch, useState } from '#imports'

export type ContentItem = {
  id: string
  title: string
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export function useContent() {
  const items = useState<ContentItem[] | null>('contentItems', () => null)
  const total = useState<number>('contentTotal', () => 0)

  async function list(params?: { status?: string; skip?: number; take?: number }) {
    const { data, error } = await useFetch('/api/content', { query: params })
    if (!error.value) {
      items.value = (data.value as any)?.items ?? []
      total.value = (data.value as any)?.total ?? 0
    }
  }

  async function create(payload: { title: string; body?: string; aiPrompt?: string; scheduledAt?: string | null }) {
    const { error } = await useFetch('/api/content', { method: 'POST', body: payload })
    if (!error.value) await list()
  }

  async function update(id: string, payload: { title?: string; body?: string; aiPrompt?: string; status?: string; scheduledAt?: string | null }) {
    await useFetch(`/api/content/${id}`, { method: 'PATCH', body: payload })
  }

  async function remove(id: string) {
    await useFetch(`/api/content/${id}`, { method: 'DELETE' })
    await list()
  }

  return { items, total, list, create, update, remove }
}


