import test from 'node:test'
import assert from 'node:assert/strict'
import client from './client.js'
import { buildDiagnosisPayload } from './diagnose.js'
import { getExplicitLanguagePayload } from './language.js'
import {
  buildHarmonizerPayload,
  calculateHarmonizedPlan,
} from './harmonizer.js'
import {
  getHarmonizerErrorMessage,
  getLanguageDowngradeWarnings,
  getRecommendedSubjectMatrix,
} from './harmonizerData.js'

test('diagnosis payload submits selected languages using snake_case fields', () => {
  const payload = buildDiagnosisPayload({
    school_level: 'top',
    student_rank: 'top25',
    interest_track: 'pure_cs',
    stay_plan: 'must_stay',
    primaryLanguage: 'Greek',
    primaryLangLevel: 'native_a',
    secondaryLanguage: 'English',
    secondaryLangLevel: 'fluent_b_hl',
  })

  assert.equal(payload.primary_language, 'Greek')
  assert.equal(payload.primary_lang_level, 'native_a')
  assert.equal(payload.secondary_language, 'English')
  assert.equal(payload.secondary_lang_level, 'fluent_b_hl')
  assert.equal('primaryLanguage' in payload, false)
})

test('harmonizer request prefers the saved profile ID without stale language fields', () => {
  const payload = buildHarmonizerPayload(['program-1'], {
    profileId: 'profile-new',
    answers: {
      primaryLanguage: 'Chinese',
      secondaryLanguage: 'English',
    },
  })

  assert.deepEqual(payload, {
    program_ids: ['program-1'],
    profile_id: 'profile-new',
  })
})

test('diagnosis profile ID is included in the actual harmonizer HTTP request', async () => {
  const previousAdapter = client.defaults.adapter
  let requestBody
  client.defaults.adapter = async (config) => {
    requestBody = JSON.parse(config.data)
    return {
      data: { recommended_subject_matrix: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }

  try {
    await calculateHarmonizedPlan(['program-1'], {
      profileId: 'diagnosis-profile-id',
      answers: {
        primaryLanguage: 'Chinese',
        secondaryLanguage: 'English',
      },
    })
  } finally {
    client.defaults.adapter = previousAdapter
  }

  assert.deepEqual(requestBody, {
    program_ids: ['program-1'],
    profile_id: 'diagnosis-profile-id',
  })
})

test('harmonizer request cannot silently use default languages without a profile', () => {
  const answers = {
    primaryLanguage: 'Chinese',
    primaryLangLevel: 'native_a',
    primaryLanguageConfirmed: false,
    secondaryLanguage: 'English',
    secondaryLangLevel: 'fluent_b_hl',
    secondaryLanguageConfirmed: false,
  }

  assert.equal(getExplicitLanguagePayload(answers), null)
  assert.throws(
    () => buildHarmonizerPayload(['program-1'], { answers }),
    /请先完成诊断/,
  )
})

test('harmonizer request can use explicitly confirmed languages without a profile', () => {
  const payload = buildHarmonizerPayload(['program-1'], {
    answers: {
      primaryLanguage: 'Greek',
      primaryLangLevel: 'native_a',
      primaryLanguageConfirmed: true,
      secondaryLanguage: 'English',
      secondaryLangLevel: 'fluent_b_hl',
      secondaryLanguageConfirmed: true,
    },
  })

  assert.equal(payload.primary_language, 'Greek')
  assert.equal(payload.secondary_language, 'English')
  assert.equal('profile_id' in payload, false)
})

test('recommended matrix uses backend language subjects and excludes hard-coded languages', () => {
  const subjects = getRecommendedSubjectMatrix({
    recommended_subject_matrix: [
      { subject_code: 'GREEK_A', group_number: 1 },
      { subject_code: 'ENGLISH_B', group_number: 2 },
    ],
    harmonized_subjects: [{ subject_code: 'CHINESE_A' }],
  })

  assert.deepEqual(
    subjects.map((subject) => subject.subject_code),
    ['GREEK_A', 'ENGLISH_B'],
  )
  assert.deepEqual(
    getRecommendedSubjectMatrix({
      harmonized_subjects: [{ subject_code: 'CHINESE_A' }],
    }),
    [],
  )
})

test('second-language downgrade warning is identified for explanation display', () => {
  const warnings = getLanguageDowngradeWarnings([
    {
      rule_code: 'SECOND_LANGUAGE_HL_DOWNGRADED',
      description: '第二语言因 HL 名额协调被降为 SL。',
    },
    { rule_code: 'OTHER_WARNING' },
  ])

  assert.equal(warnings.length, 1)
  assert.match(warnings[0].description, /降为 SL/)
})

test('422 harmonizer errors explain missing profile or language inputs', () => {
  const message = getHarmonizerErrorMessage({
    response: { status: 422, data: {} },
  })

  assert.match(message, /422/)
  assert.match(message, /完成诊断/)
})
