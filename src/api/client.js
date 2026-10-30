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

client.interceptors.request.use((config) => {
  const currentLanguage = i18n.language?.startsWith('zh') ? 'zh' : 'en'
  config.headers.set('Accept-Language', currentLanguage)
  return config
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)

export default client
