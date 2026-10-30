import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import enTranslation from './locales/en/translation.json' with { type: 'json' }
import zhTranslation from './locales/zh/translation.json' with { type: 'json' }

const storage =
  typeof window === 'undefined' ? null : window.localStorage
const storedLanguage = storage?.getItem('i18nextLng')
const initialLanguage = storedLanguage?.startsWith('zh') ? 'zh' : 'en'
const copyNamespaces = ['wizard', 'wiki', 'extra', 'timeline']
const chineseTranslations = { ...zhTranslation }

for (const namespace of copyNamespaces) {
  const englishCopy = enTranslation[namespace]?.copy
  if (!englishCopy) continue
  chineseTranslations[namespace] = {
    ...zhTranslation[namespace],
    copy: Object.fromEntries(
      Object.keys(englishCopy).map((sourceText) => [sourceText, sourceText]),
    ),
  }
}

if (storedLanguage !== initialLanguage) {
  storage?.setItem('i18nextLng', initialLanguage)
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      zh: { translation: chineseTranslations },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh'],
    nonExplicitSupportedLngs: false,
    load: 'languageOnly',
    lng: initialLanguage,
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })

i18n.on('languageChanged', (language) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    'i18nextLng',
    language.startsWith('zh') ? 'zh' : 'en',
  )
})

export default i18n
