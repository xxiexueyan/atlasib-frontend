import axios from 'axios'
import i18n from '../i18n.js'

const viteEnv = import.meta.env ?? {}
const defaultBaseURL = viteEnv.DEV
  ? 'http://127.0.0.1:8000/api/v1'
  : 'https://atlasib.xxy-info.site/api/v1'

const client = axios.create({
  baseURL: viteEnv.VITE_API_BASE_URL || defaultBaseURL,
  timeout: 10000,
})

function isBackendApiRequest(config) {
  try {
    const apiBase = new URL(client.defaults.baseURL)
    const requestBase = config.baseURL || client.defaults.baseURL
    const target = resolveRequestUrl(config.url, requestBase)
    const basePath = apiBase.pathname.replace(/\/+$/, '')
    const usesHttps = target.protocol === 'https:' && apiBase.protocol === 'https:'
    const isLocalDevelopment =
      apiBase.protocol === 'http:' &&
      target.protocol === 'http:' &&
      target.hostname === apiBase.hostname &&
      ['localhost', '127.0.0.1', '[::1]'].includes(apiBase.hostname)
    return (
      (usesHttps || isLocalDevelopment) &&
      target.origin === apiBase.origin &&
      (target.pathname === basePath ||
        target.pathname.startsWith(`${basePath}/`))
    )
  } catch {
    return false
  }
}

function resolveRequestUrl(url, baseURL) {
  try {
    return new URL(url)
  } catch {
    const apiBase = new URL(baseURL)
    if (url.startsWith('//')) return new URL(url, apiBase)
    const normalizedBaseURL = apiBase.href.endsWith('/')
      ? apiBase.href
      : `${apiBase.href}/`
    return new URL(url.replace(/^\/+/, ''), normalizedBaseURL)
  }
}

function isSendOtpRequest(config) {
  try {
    const apiBase = new URL(client.defaults.baseURL)
    const target = resolveRequestUrl(
      config.url,
      config.baseURL || client.defaults.baseURL,
    )
    return (
      target.origin === apiBase.origin &&
      target.pathname ===
        `${apiBase.pathname.replace(/\/+$/, '')}/auth/send-otp`
    )
  } catch {
    return false
  }
}

client.interceptors.request.use((config) => {
  const currentLanguage = i18n.language?.startsWith('zh') ? 'zh' : 'en'
  config.headers.set('Accept-Language', currentLanguage)
  if (isBackendApiRequest(config) && !isSendOtpRequest(config)) {
    try {
      const token = globalThis.window?.localStorage?.getItem(
        'atlasib_session_token',
      )
      if (token) config.headers.set('Authorization', `Bearer ${token}`)
    } catch {
      console.warn('Could not read the saved authentication session.')
    }
  }
  return config
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)

export default client
