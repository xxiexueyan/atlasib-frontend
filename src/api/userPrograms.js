import client from './client.js'

function encodePathSegment(value) {
  return encodeURIComponent(value)
}

export const userProgramApi = {
  getProfile(profileId) {
    return client.get(`/profiles/${encodePathSegment(profileId)}`)
  },

  getSelectedPrograms(profileId) {
    return client.get(`/profiles/${encodePathSegment(profileId)}/programs`)
  },

  addProgram(profileId, programId) {
    return client.post(`/profiles/${encodePathSegment(profileId)}/programs`, {
      program_id: programId,
    })
  },

  removeProgram(profileId, programId) {
    return client.delete(
      `/profiles/${encodePathSegment(profileId)}/programs/${encodePathSegment(programId)}`,
    )
  },

  batchSavePrograms(profileId, programIds) {
    return client.put(
      `/profiles/${encodePathSegment(profileId)}/programs/batch`,
      { program_ids: programIds },
    )
  },

  restoreSessionByToken(token) {
    return client.get('/auth/restore-session', { params: { token } })
  },

  resolveConflict(restoreToken, action) {
    return client.post('/auth/resolve-claim-conflict', {
      restore_token: restoreToken,
      action,
    })
  },

  claimProfileEmail(profileId, email, lang = 'en', scenarios = null, activeScenarioId = null) {
    const payload = {
      email: email.trim(),
      send_email_report: true,
      lang,
    }
    if (Array.isArray(scenarios) && scenarios.length > 0) {
      payload.scenarios = scenarios
      payload.active_scenario_id = activeScenarioId
    }
    return client.post(
      `/profiles/${encodePathSegment(profileId)}/claim-email`,
      payload,
    )
  },
}
