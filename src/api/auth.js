import client from './client.js'

export const authApi = {
  sendOtp(email, lang = 'en') {
    return client.post('/auth/send-otp', {
      email: email.trim(),
      lang,
    })
  },

  verifyOtp(email, code, currentProfileId = null, lang = 'en') {
    return client.post('/auth/verify-otp', {
      email: email.trim(),
      code: code.trim(),
      current_profile_id: currentProfileId,
      lang,
    })
  },

  me() {
    return client.get('/auth/me')
  },

  logout() {
    return client.post('/auth/logout')
  },
}
