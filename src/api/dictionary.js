import client from './client.js'

export function getPrograms(params = {}) {
  return client.get('/programs', { params })
}

export function mergeProgramDetails(program, fallback = {}) {
  const availableProgramFields = Object.fromEntries(
    Object.entries(program ?? {}).filter(
      ([, value]) => value !== null && value !== undefined,
    ),
  )
  return Object.fromEntries(
    Object.entries({ ...fallback, ...availableProgramFields }).filter(
      ([, value]) => value !== null && value !== undefined,
    ),
  )
}
