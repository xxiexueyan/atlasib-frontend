import axios from 'axios'

const viteEnv = import.meta.env ?? {}
const defaultBaseURL = viteEnv.DEV
  ? 'http://127.0.0.1:8000/api/v1'
  : '/api/v1'

const client = axios.create({
  baseURL: viteEnv.VITE_API_BASE_URL || defaultBaseURL,
  timeout: 10000,
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)

export default client
