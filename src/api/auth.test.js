import test from 'node:test'
import assert from 'node:assert/strict'
import client from './client.js'
import { authApi } from './auth.js'

function createStorage(values) {
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('auth API sends OTP and verification payloads to the documented endpoints', async () => {
  const previousAdapter = client.defaults.adapter
  const requests = []
  client.defaults.adapter = async (config) => {
    requests.push(config)
    return {
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }

  try {
    await authApi.sendOtp(' person@example.com ', 'zh')
    await authApi.verifyOtp(
      ' person@example.com ',
      ' 123456 ',
      'profile-1',
      'zh',
    )
    await authApi.me()
    await authApi.logout()
  } finally {
    client.defaults.adapter = previousAdapter
  }

  assert.deepEqual(
    requests.map(({ url, method }) => [url, method]),
    [
      ['/auth/send-otp', 'post'],
      ['/auth/verify-otp', 'post'],
      ['/auth/me', 'get'],
      ['/auth/logout', 'post'],
    ],
  )
  assert.deepEqual(JSON.parse(requests[0].data), {
    email: 'person@example.com',
    lang: 'zh',
  })
  assert.deepEqual(JSON.parse(requests[1].data), {
    email: 'person@example.com',
    code: '123456',
    current_profile_id: 'profile-1',
    lang: 'zh',
  })
})

test('session token is sent only to backend API requests, excluding OTP delivery', async () => {
  const previousAdapter = client.defaults.adapter
  const previousWindow = globalThis.window
  const values = new Map([['atlasib_session_token', 'test-session-token']])
  const requests = []
  globalThis.window = { localStorage: createStorage(values) }
  client.defaults.adapter = async (config) => {
    requests.push(config)
    return {
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }

  try {
    await client.get('/auth/me')
    await authApi.sendOtp('person@example.com')
    await client.get('https://third-party.example/resource')
    await client.get('//third-party.example/resource')
  } finally {
    client.defaults.adapter = previousAdapter
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }

  assert.equal(
    requests[0].headers.get('Authorization'),
    'Bearer test-session-token',
  )
  assert.equal(requests[1].headers.get('Authorization'), undefined)
  assert.equal(requests[2].headers.get('Authorization'), undefined)
  assert.equal(requests[3].headers.get('Authorization'), undefined)
})
