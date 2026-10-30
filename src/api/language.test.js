import test from 'node:test'
import assert from 'node:assert/strict'
import client from './client.js'
import i18n from '../i18n.js'
import { buildDiagnosisPayload } from './diagnose.js'
import { mergeProgramDetails } from './dictionary.js'
import {
  formatLocalAnnualTuition,
  getLocalAnnualTuition,
} from './programCost.js'
import { getExplicitLanguagePayload } from './language.js'
import {
  buildHarmonizerPayload,
  calculateHarmonizedPlan,
  calculateMultiScenario,
} from './harmonizer.js'
import {
  getHarmonizerErrorMessage,
  getLanguageDowngradeWarnings,
  getMandatorySubjectsForProgram,
  getProgramFitStatus,
  getProgramLanguageTip,
  getRecommendedSubjectMatrix,
  getSelectedScenarioId,
} from './harmonizerData.js'
import { userProgramApi } from './userPrograms.js'

test('English is the default language without a stored preference', () => {
  assert.equal(i18n.language, 'en')
})

test('scenario selection safely falls back before harmonizer data loads', () => {
  assert.equal(getSelectedScenarioId(null, undefined), undefined)
  assert.equal(
    getSelectedScenarioId(null, {
      recommended_scenario_id: 'plan_max_coverage',
    }),
    'plan_max_coverage',
  )
})

test('API requests send the active language in Accept-Language', async () => {
  const previousAdapter = client.defaults.adapter
  const previousLanguage = i18n.language
  const requestLanguages = []
  client.defaults.adapter = async (config) => {
    requestLanguages.push(config.headers.get('Accept-Language'))
    return {
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }

  try {
    await i18n.changeLanguage('en')
    await client.get('/language-check')
    await i18n.changeLanguage('zh')
    await client.get('/language-check')
  } finally {
    await i18n.changeLanguage(previousLanguage)
    client.defaults.adapter = previousAdapter
  }

  assert.deepEqual(requestLanguages, ['en', 'zh'])
})

test('changing languages persists the selected language in local storage', async () => {
  const previousWindow = globalThis.window
  const previousLanguage = i18n.language
  const values = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  }

  try {
    await i18n.changeLanguage('zh')
    assert.equal(values.get('i18nextLng'), 'zh')
    await i18n.changeLanguage('en')
    assert.equal(values.get('i18nextLng'), 'en')
  } finally {
    await i18n.changeLanguage(previousLanguage)
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
})

test('tuition is shown in its country currency and excludes living costs', () => {
  const tuition = getLocalAnnualTuition({
    country_id: 'DEU',
    tuition_local_per_year: '1500.00',
    living_cost_per_year: '10500.00',
    est_total_rmb_per_year: 8,
  })

  assert.deepEqual(tuition, { amount: 1500, currency: 'EUR' })
  assert.equal(
    formatLocalAnnualTuition({
      country_name: '加拿大',
      tuition_local_per_year: '20000',
      living_cost_per_year: '15000',
      est_total_rmb_per_year: 25,
    }),
    '约 20,000 CAD / 年',
  )
  const englishLabels = {
    'common.approx': 'Approx.',
    'common.year': '/ year',
    'programs.no_tuition': 'Tuition unavailable',
  }
  assert.equal(
    formatLocalAnnualTuition(
      {
        country_id: 'CAN',
        tuition_local_per_year: '20000',
      },
      (key) => englishLabels[key],
      'en-US',
    ),
    'Approx. 20,000 CAD / year',
  )
  assert.equal(
    formatLocalAnnualTuition({
      living_cost_per_year: '15000',
      est_total_rmb_per_year: 8,
    }),
    '暂无学费数据',
  )
})

test('diagnosis recommendation data is enriched from the program catalog', () => {
  const enriched = mergeProgramDetails(
    {
      program_id: 'program-1',
      university_name: 'Example University',
      est_annual_rmb: 20,
      tuition_local_per_year: null,
    },
    {
      program_id: 'program-1',
      country_id: 'CAN',
      tuition_local_per_year: '35000',
      living_cost_per_year: '15000',
    },
  )

  assert.equal(enriched.tuition_local_per_year, '35000')
  assert.equal(enriched.living_cost_per_year, '15000')
  assert.equal(enriched.university_name, 'Example University')
})

test('saving an empty volunteer list sends an empty array to the new profile', async () => {
  const previousAdapter = client.defaults.adapter
  let requestConfig
  client.defaults.adapter = async (config) => {
    requestConfig = config
    return {
      data: { program_ids: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }

  try {
    await userProgramApi.batchSavePrograms('new-profile', [])
  } finally {
    client.defaults.adapter = previousAdapter
  }

  assert.equal(requestConfig.method, 'put')
  assert.equal(requestConfig.url, '/profiles/new-profile/programs/batch')
  assert.deepEqual(JSON.parse(requestConfig.data), { program_ids: [] })
})

test('claiming an email encodes the profile ID and sends the report request', async () => {
  const previousAdapter = client.defaults.adapter
  let requestConfig
  client.defaults.adapter = async (config) => {
    requestConfig = config
    return {
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }

  try {
    await userProgramApi.claimProfileEmail('profile / 1', '  student@example.com  ', 'zh')
  } finally {
    client.defaults.adapter = previousAdapter
  }

  assert.equal(requestConfig.method, 'post')
  assert.equal(requestConfig.url, '/profiles/profile%20%2F%201/claim-email')
  assert.deepEqual(JSON.parse(requestConfig.data), {
    email: 'student@example.com',
    send_email_report: true,
    lang: 'zh',
  })
})

test('program fit status distinguishes external language requirements', () => {
  assert.equal(
    getProgramFitStatus(
      { fit_status: 'SUBJECT_FIT_EXTERNAL_LANG_REQ' },
      true,
    ),
    'SUBJECT_FIT_EXTERNAL_LANG_REQ',
  )
  assert.equal(
    getProgramFitStatus({ fit_status: 'UNFIT' }, true),
    'UNFIT',
  )
  assert.equal(getProgramFitStatus({}, true), 'FULLY_COVERED')
  assert.equal(getProgramFitStatus({}, false), 'UNFIT')
})

test('required program subjects are taken from mandatory harmonizer requests only', () => {
  const program = {
    university_name: '亚琛工业大学',
    name_cn: '计算机科学学士 (Informatik)',
  }
  const harmonizeData = {
    scenarios: [
      {
        subjects: [
          {
            subject_code: 'MATH_AA',
            subject_name: 'Mathematics: Analysis and Approaches',
            requested_by: [
              '亚琛工业大学 - 计算机科学学士 (Informatik) [MANDATORY: HL 6分]',
            ],
          },
          {
            subject_code: 'CS',
            subject_name: 'Computer Science',
            requested_by: [
              '亚琛工业大学 - 计算机科学学士 (Informatik) [PREFERRED: ANY 5分]',
            ],
          },
        ],
      },
    ],
  }

  assert.deepEqual(
    getMandatorySubjectsForProgram(program, harmonizeData),
    ['Mathematics: Analysis and Approaches'],
  )
})

test('language tip prefers backend copy and builds a fallback from language fields', () => {
  assert.equal(
    getProgramLanguageTip({
      language_tip: '请提交 TestDaF 4x4 成绩。',
      instruction_language: 'German',
    }),
    '请提交 TestDaF 4x4 成绩。',
  )
  assert.match(
    getProgramLanguageTip({
      instruction_language: 'German',
      external_language_test_req: 'TestDaF 4x4',
    }),
    /German.*TestDaF 4x4/,
  )
  assert.equal(
    getProgramLanguageTip(
      {
        language_tip:
          'obtain 德语证书 (TestDaF 4x4) 注册前提交 before enrollment',
        instruction_language: 'German',
      },
      (key) =>
        key === 'harmonizer.language_tip_german'
          ? 'Academic requirements met. Taught in German; proof of German proficiency (TestDaF 4x4, DSH-2, or telc C1) must be submitted prior to matriculation.'
          : key,
      'en',
    ),
    'Academic requirements met. Taught in German; proof of German proficiency (TestDaF 4x4, DSH-2, or telc C1) must be submitted prior to matriculation.',
  )
})

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

  assert.match(message.message, /422/)
})

test('multi-scenario calculation sends profile and selected programs to the new endpoint', async () => {
  const previousAdapter = client.defaults.adapter
  let requestConfig
  client.defaults.adapter = async (config) => {
    requestConfig = config
    return {
      data: { scenarios: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }

  try {
    await calculateMultiScenario({
      program_ids: ['greek-cs', 'english-engineering'],
      profile_id: 'profile-123',
    })
  } finally {
    client.defaults.adapter = previousAdapter
  }

  assert.equal(requestConfig.url, '/harmonizer/calculate-multi-scenario')
  assert.deepEqual(JSON.parse(requestConfig.data), {
    program_ids: ['greek-cs', 'english-engineering'],
    profile_id: 'profile-123',
  })
})

test('multi-scenario calculation rejects an empty or oversized selection', () => {
  assert.throws(() => calculateMultiScenario({ program_ids: [] }), /1 到 50/)
  assert.throws(
    () =>
      calculateMultiScenario({
        program_ids: Array.from({ length: 51 }, (_, index) => `program-${index}`),
      }),
    /1 到 50/,
  )
})

test('multi-scenario API errors provide the missing program IDs', () => {
  const info = getHarmonizerErrorMessage({
    response: {
      status: 404,
      data: {
        error: {
          code: 'program_not_found',
          details: { program_ids: ['old-program'] },
        },
      },
    },
  })

  assert.equal(info.code, 'program_not_found')
  assert.deepEqual(info.programIds, ['old-program'])
  assert.match(info.message, /下架/)
})

test('multi-scenario backend data errors receive the documented explanation', () => {
  const info = getHarmonizerErrorMessage({
    response: {
      status: 503,
      data: { error: { code: 'ib_subjects_missing' } },
    },
  })

  assert.match(info.message, /数据暂不完整/)
})
