import { computed, Ref } from 'vue'
import { useAsyncData, useRoute } from '#imports'
import { $fetch } from 'ofetch'

export type ContentStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'

export interface ContentSummary {
  id: string
  title: string
  status: ContentStatus
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ContentVersion {
  version: number
  body: string
  aiPrompt: string | null
}

export interface ContentDetail {
  id: string
  workspaceId: string
  title: string
  status: ContentStatus
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  version: ContentVersion | null
}

export interface ListParams {
  status?: ContentStatus | ''
  take?: number
  skip?: number
}

export function useContentList(params: Ref<ListParams>) {
  const route = useRoute()
  const key = computed(() => `content-list:${JSON.stringify({ w: route.query.w, ...params.value })}`)
  const query = computed(() => ({
    status: params.value.status || undefined,
    take: params.value.take ?? 20,
    skip: params.value.skip ?? 0
  }))
  const { data, pending, refresh, error } = useAsyncData(key, () =>
    $fetch<{ items: ContentSummary[]; total: number }>('/api/content', { query: query.value })
  )
  return { data, pending, refresh, error }
}

export function useContentItem(id: Ref<string>) {
  const route = useRoute()
  const key = computed(() => `content-item:${id.value}:${route.query.w}`)
  const { data, pending, refresh, error } = useAsyncData(key, () =>
    $fetch<ContentDetail>(`/api/content/${encodeURIComponent(id.value)}`)
  )
  return { data, pending, refresh, error }
}

export async function createContent(payload: { title: string; body?: string; aiPrompt?: string; scheduledAt?: string | null }) {
  const res: { id: string } = await $fetch('/api/content', { method: 'POST', body: payload })
  return res.id
}

export async function updateContent(id: string, payload: { title?: string; body?: string; aiPrompt?: string; status?: ContentStatus; scheduledAt?: string | null }) {
  await $fetch(`/api/content/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload })
}

export async function deleteContent(id: string) {
  await $fetch(`/api/content/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

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


