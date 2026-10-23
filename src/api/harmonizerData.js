export function getRecommendedSubjectMatrix(plan) {
  return Array.isArray(plan?.recommended_subject_matrix)
    ? plan.recommended_subject_matrix
    : []
}

export function getLanguageDowngradeWarnings(warnings) {
  if (!Array.isArray(warnings)) return []

  return warnings.filter(
    (warning) =>
      (warning?.rule_code ?? warning?.ruleCode) ===
      'SECOND_LANGUAGE_HL_DOWNGRADED',
  )
}

export function getHarmonizerErrorMessage(error) {
  const status = error?.response?.status
  const detail = error?.response?.data?.detail
  const detailText = Array.isArray(detail)
    ? detail
        .map((item) => {
          const location = Array.isArray(item?.loc) ? item.loc.join(' → ') : ''
          const message = item?.msg ?? '请求参数校验失败'
          return location ? `${location}: ${message}` : message
        })
        .join('；')
    : typeof detail === 'string'
      ? detail
      : ''

  if (status === 422) {
    return detailText
      ? `排课请求未通过校验（422）：${detailText}。请确认画像 ID 或两种语言信息完整。`
      : '排课请求未通过校验（422）。请先完成诊断保存画像，或提供第一语言和第二语言。'
  }
  if (detailText) return detailText
  return error instanceof Error ? error.message : '请稍后重试。'
}
