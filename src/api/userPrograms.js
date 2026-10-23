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
}
