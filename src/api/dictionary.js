import client from './client.js'

export function getPrograms(params = {}) {
  return client.get('/programs', { params })
}
