function getLanguageValue(language, customLanguage, fallback) {
  if (language === 'Other') return customLanguage?.trim() || fallback
  return language || fallback
}

function getProvidedLanguageValue(language, customLanguage) {
  if (language === 'Other') return customLanguage?.trim() || ''
  return typeof language === 'string' ? language.trim() : ''
}

export function getLanguagePayload(answers = {}) {
  return {
    primary_language: getLanguageValue(
      answers.primaryLanguage ?? answers.primary_language,
      answers.primaryLanguageCustom,
      'Chinese',
    ),
    primary_lang_level:
      answers.primaryLangLevel ?? answers.primary_lang_level ?? 'native_a',
    secondary_language: getLanguageValue(
      answers.secondaryLanguage ?? answers.secondary_language,
      answers.secondaryLanguageCustom,
      'English',
    ),
    secondary_lang_level:
      answers.secondaryLangLevel ??
      answers.secondary_lang_level ??
      'fluent_b_hl',
  }
}

export function getExplicitLanguagePayload(answers = {}) {
  const primaryLanguage = getProvidedLanguageValue(
    answers.primaryLanguage ?? answers.primary_language,
    answers.primaryLanguageCustom,
  )
  const secondaryLanguage = getProvidedLanguageValue(
    answers.secondaryLanguage ?? answers.secondary_language,
    answers.secondaryLanguageCustom,
  )

  if (
    !primaryLanguage ||
    !secondaryLanguage ||
    answers.primaryLanguageConfirmed === false ||
    answers.secondaryLanguageConfirmed === false
  ) {
    return null
  }

  return {
    primary_language: primaryLanguage,
    secondary_language: secondaryLanguage,
    ...(answers.primaryLangLevel || answers.primary_lang_level
      ? {
          primary_lang_level:
            answers.primaryLangLevel ?? answers.primary_lang_level,
        }
      : {}),
    ...(answers.secondaryLangLevel || answers.secondary_lang_level
      ? {
          secondary_lang_level:
            answers.secondaryLangLevel ?? answers.secondary_lang_level,
        }
      : {}),
  }
}
