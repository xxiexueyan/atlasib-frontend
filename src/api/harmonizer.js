import client from './client.js'
import { getExplicitLanguagePayload } from './language.js'

export function buildHarmonizerPayload(programIds, options = {}) {
  const payload = { program_ids: programIds }
  if (options.profileId) {
    payload.profile_id = options.profileId
  } else {
    const languages = getExplicitLanguagePayload(options.answers)
    if (!languages) {
      throw new Error(
        '请先完成诊断以保存画像，或明确选择第一语言和第二语言后再生成排课方案。',
      )
    }
    Object.assign(payload, languages)
  }
  return payload
}

export function calculateHarmonizedPlan(programIds, options = {}) {
  const payload = buildHarmonizerPayload(programIds, options)
  return client.post('/harmonizer/calculate', payload)
}

export function calculateMultiScenario(payload) {
  if (
    !Array.isArray(payload?.program_ids) ||
    payload.program_ids.length < 1 ||
    payload.program_ids.length > 50
  ) {
    throw new RangeError('多方案排课需要 1 到 50 个已选专业。')
  }

  return client.post('/harmonizer/calculate-multi-scenario', payload)
}

export const calculateHarmonizer = calculateHarmonizedPlan
