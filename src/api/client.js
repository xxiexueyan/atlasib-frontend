import axios from 'axios'

const client = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  timeout: 10000,
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)

export default client
