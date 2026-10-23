import client from './client.js'
import { getLanguagePayload } from './language.js'

export function buildDiagnosisPayload(answers) {
  return {
    school_level: answers.school_level,
    student_rank: answers.student_rank,
    interest_track: answers.interest_track,
    country_pref: answers.country_pref,
    budget: answers.budget,
    stay_plan: answers.stay_plan,
    ...getLanguagePayload(answers),
    client_device_id: answers.client_device_id,
  }
}

export function submitDiagnosis(answers) {
  const payload = buildDiagnosisPayload(answers)
  return client.post('/diagnose', payload)
}
