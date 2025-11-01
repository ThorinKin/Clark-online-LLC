// Login_react/src/service/fetch.js
//import { stringifyQuery } from 'vue-router'
import { getErrMsg, ServerError } from '@/service/Error'
import { forEach, isArray } from 'lodash-es'
import Token from '@/service/token'

function createFetchOptions(options) {
  const fetchOpt = {
    method: options.method ?? 'POST',
  }
  const headers = new Headers()
  headers.append('Accept', 'application/json')

  switch (fetchOpt.method) {
    case 'POST': {
      if (options.payload instanceof FormData) {
        headers.append('Content-Type', 'multipart/form-data')
        fetchOpt.body = options.payload
      } else {
        headers.append('Content-Type', 'application/json')
        fetchOpt.body = JSON.stringify(options.payload)
      }
      break
    }
    default: {
      break
    }
  }

  if (options.signal) {
    fetchOpt.signal = options.signal
  }
  forEach(options.headers, (value, key) => {
    headers.append(key, value)
  })
  // headers.append(
  //   'Authorization',
  //   `Bearer ${Token.get()}`, // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJBdXRob3JpemUiLCJVc2VySUQiOiJkYW5pZWwuemhhbmdAeHN1bnQuY29tIiwiQlBTU08iOiIxIiwiR2VvSUQiOiI5MDAwMDAwMCIsIkRlZmF1bHRHZW8iOiI5MDAwMDAwMCIsImV4cCI6MTg2NDQ4MzIwMCwiaWF0IjoxODY0NDgzMjAwLCJpc3MiOiJYU1VOVCIsImF1ZCI6Ik9uZWxvb2szIn0.QD2_T-QDyqJzfxybovcZTetSUrnixTb3VYV-V1Gd0UY,
  // )
  fetchOpt.headers = headers
  return fetchOpt
}

async function requestWithFetch(url, options) {
    const fetchOpt = createFetchOptions(options)
    if (url.startsWith('/')) url = import.meta.env.VITE_API_SERVER + url

    if (fetchOpt.method === 'GET' && options.payload) {
        const qs = new URLSearchParams(options.payload)
        if (qs.toString()) url += (url.includes('?') ? '&' : '?') + qs.toString()
    }

    const res = await fetch(url, fetchOpt)

    // 先拿文本，再尝试 parse JSON；避免 500 页导致的 JSON 解析异常
    const text = await res.text()
    let content
    try {
        content = text ? JSON.parse(text) : {}
    } catch {
        content = null
    }

    if (res.ok && content) {
        const { Success, Response, Code, Msg } = content
        if (Success) return Response
        throw new ServerError(Msg || 'Request failed', Code || res.status)
    }

    // 非 JSON 的错误，直接把文本抛出去
    const snippet = (text || '').slice(0, 400)
    throw new Error(snippet || `HTTP ${res.status}`)
}

export { requestWithFetch }
