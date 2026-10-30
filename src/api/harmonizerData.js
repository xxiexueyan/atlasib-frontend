export function getRecommendedSubjectMatrix(plan) {
  return Array.isArray(plan?.recommended_subject_matrix)
    ? plan.recommended_subject_matrix
    : []
}

export function requiresExternalLanguageStudy(scenario) {
  return scenario?.external_language_study_required === true
}

export function getSelectedScenarioId(scenarioSelection, harmonizeData) {
  if (scenarioSelection && scenarioSelection.data === harmonizeData) {
    return scenarioSelection.scenarioId
  }

  return harmonizeData?.recommended_scenario_id
}

export function getProgramFitStatus(program, covered) {
  const fitStatus = program?.fit_status
  if (
    fitStatus === 'FULLY_COVERED' ||
    fitStatus === 'SUBJECT_FIT_EXTERNAL_LANG_REQ' ||
    fitStatus === 'UNFIT'
  ) {
    return fitStatus
  }

  return covered ? 'FULLY_COVERED' : 'UNFIT'
}

export function getProgramLanguageTip(program, t, language) {
  const languageTip = program?.language_tip
  const hasMixedChinese = /[\u3400-\u9fff]/.test(languageTip ?? '')
  if (
    typeof languageTip === 'string' &&
    languageTip.trim() &&
    (!hasMixedChinese || !language?.startsWith('en'))
  ) {
    return program.language_tip
  }

  const rawInstructionLanguage = program?.instruction_language ?? ''
  if (
    t &&
    language?.startsWith('en') &&
    /^(german|deutsch|德语)$/i.test(rawInstructionLanguage.trim())
  ) {
    return t('harmonizer.language_tip_german')
  }

  const instructionLanguage =
    rawInstructionLanguage ||
    (t ? t('harmonizer.non_english') : '非英语')
  const languageTest =
    program?.external_language_test_req ??
    (t ? t('harmonizer.language_test') : '相应的语言能力考试')
  if (t) {
    return t('harmonizer.language_tip_fallback', {
      language: instructionLanguage,
      test: languageTest,
    })
  }
  return `大学为${instructionLanguage}授课，IB 完成学科要求后，需在入学前通过${languageTest}。`
}

export function getMandatorySubjectsForProgram(program, harmonizeData) {
  const universityName = program?.university_name ?? program?.universityName
  const programName =
    program?.name_cn ??
    program?.program_name_zh ??
    program?.program_name ??
    program?.programName
  if (!universityName || !programName) return []

  const programLabel = `${universityName} - ${programName}`.toLocaleLowerCase()
  const subjects = new Map()
  for (const scenario of harmonizeData?.scenarios ?? []) {
    for (const subject of scenario.subjects ?? []) {
      const isRequiredForProgram = (subject.requested_by ?? []).some(
        (request) =>
          typeof request === 'string' &&
          request.toLocaleLowerCase().includes(programLabel) &&
          /\[mandatory:/i.test(request),
      )
      if (isRequiredForProgram) {
        subjects.set(subject.subject_code, subject.subject_name)
      }
    }
  }

  return [...subjects.values()]
}

export function getLanguageDowngradeWarnings(warnings) {
  if (!Array.isArray(warnings)) return []

  return warnings.filter(
    (warning) =>
      (warning?.rule_code ?? warning?.ruleCode) ===
      'SECOND_LANGUAGE_HL_DOWNGRADED',
  )
}

export function getHarmonizerErrorMessage(error, t) {
  const translate = (key, fallback, options) =>
    t ? t(key, options) : fallback
  const status = error?.response?.status
  const apiError = error?.response?.data?.error
  const code = apiError?.code
  const message = apiError?.message
  const details = apiError?.details

  if (status === 404 && code === 'program_not_found') {
    return {
      code,
      message: translate(
        'harmonizer.program_not_found',
        '部分已选专业已下架或不存在，请移除失效志愿后重试。',
      ),
      programIds: Array.isArray(details?.program_ids)
        ? details.program_ids.filter((id) => typeof id === 'string')
        : [],
    }
  }
  if (status === 404 && code === 'profile_not_found') {
    return {
      code,
      message: translate(
        'harmonizer.profile_missing',
        '诊断画像不存在或已失效，请重新完成智能诊断后再生成方案。',
      ),
    }
  }
  if (
    status === 503 &&
    [
      'admission_data_missing',
      'ib_subjects_missing',
      'ib_subject_level_unavailable',
    ].includes(code)
  ) {
    return {
      code,
      message: translate(
        'harmonizer.backend_data_missing',
        '后端数据暂不完整，请稍后再试。',
      ),
    }
  }
  if (status === 500 && code === 'invalid_profile_language_level') {
    return {
      code,
      message: translate(
        'harmonizer.profile_language_invalid',
        '画像中的语言等级信息异常，请重新提交诊断并保存画像。',
      ),
    }
  }
  if (status === 422 && code === 'request_validation_error') {
    return {
      code,
      message:
        message ??
        translate(
          'harmonizer.validation_error',
          '排课请求参数有误，请检查志愿数量和语言设置。',
        ),
    }
  }
  if (status === 422) {
    return {
      code,
      message:
        message ??
        translate(
          'harmonizer.http_422',
          '排课请求参数错误（422），请检查志愿数量、重复专业或语言设置。',
        ),
    }
  }

  const detail = error?.response?.data?.detail
  const detailText = Array.isArray(detail)
    ? detail
        .map((item) => {
          const location = Array.isArray(item?.loc) ? item.loc.join(' → ') : ''
          const message =
            item?.msg ??
            translate('errors.validation_failed', '请求参数校验失败')
          return location ? `${location}: ${message}` : message
        })
        .join(translate('errors.message_separator', '；'))
    : typeof detail === 'string'
      ? detail
      : ''

  return {
    code,
    message:
      message ??
      (detailText
        ? `排课请求失败：${detailText}`
        : error instanceof Error
          ? error.message
          : translate('errors.request_failed', '请稍后重试。')),
  }
}
