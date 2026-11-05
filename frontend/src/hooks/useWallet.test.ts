import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useWallet } from './useWallet'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('useWallet', () => {
  it('starts loading, then returns the balance from GET /api/wallet', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ balance: 12450 }), { status: 200 }))

    const { result } = renderHook(() => useWallet())

    expect(result.current).toEqual({ status: 'loading' })
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', balance: 12450 }))
    expect(fetchMock.mock.calls[0][0]).toBe('/api/wallet')
  })

  it('returns an error when the request fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'Not authenticated' }), { status: 403 }))

    const { result } = renderHook(() => useWallet())

    await waitFor(() => expect(result.current).toEqual({ status: 'error' }))
  })
})
