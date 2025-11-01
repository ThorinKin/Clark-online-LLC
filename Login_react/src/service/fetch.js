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
  switch (fetchOpt.method) {
    case 'GET': {
      // 由业务自己保证 payload 可以被序列化到url
      /** 请求参数 */
      const queryStr = new URLSearchParams(options.payload)
      // 确定请求参数不为空再执行拼接操作
      if (queryStr) {
        const haveSearch = url.includes('?')
        if (haveSearch) {
          url += '&'
        } else {
          url += '?'
        }

        url += queryStr
      }
      break
    }
    case 'POST': {
      break
    }
    default: {
      throw new Error(`unknown request method: ${options.method}`)
    }
  }

  debugger
  const res = await fetch(url, fetchOpt)
  if (res.status === 401) {
    throw new ServerError('no auth', 401)
  }

  /** 统一做json解码，非json的请求出现之后再考虑适配 */
  const content = await res.json()

  if (res.ok) {
    const { Success, Response, Code, Msg } = content

    if (Success) {
      return Response
    } else {
      throw new ServerError(Msg, Code)
    }
  } else {
    const errMsg = getErrMsg(content)

    throw new Error(errMsg)
  }
}

export { requestWithFetch }
