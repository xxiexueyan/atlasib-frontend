import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { userProgramApi } from '../api/userPrograms.js'

const PlanContext = createContext(null)
const PROFILE_STORAGE_KEY = 'atlasib_profile_id'
const PROGRAMS_STORAGE_KEY = 'atlasib_selected_program_ids'
const DEVICE_STORAGE_KEY = 'atlasib_client_device_id'
const initialProgramIds = ['waterloo_se', 'oxford_cs']
const defaultWizardAnswers = {
  primaryLanguage: 'Chinese',
  primaryLangLevel: 'native_a',
  primaryLanguageConfirmed: false,
  secondaryLanguage: 'English',
  secondaryLangLevel: 'fluent_b_hl',
  secondaryLanguageConfirmed: false,
}
const supportedLanguages = new Set([
  'Chinese',
  'English',
  'Japanese',
  'Korean',
  'German',
  'French',
  'Spanish',
  'Greek',
  'Italian',
  'Portuguese',
  'Russian',
  'Arabic',
  'Hindi',
])
const validTabs = new Set([
  'wizard',
  'programs',
  'harmonizer',
  'wiki',
  'extra',
  'timeline',
])

function normalizeProgramIds(ids) {
  if (!Array.isArray(ids)) {
    throw new TypeError('Program IDs must be an array.')
  }

  return [
    ...new Set(
      ids
        .filter((id) => typeof id === 'string')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ]
}

function readStoredValue(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function readStoredProgramIds() {
  const value = readStoredValue(PROGRAMS_STORAGE_KEY)
  if (!value) return initialProgramIds

  try {
    return normalizeProgramIds(JSON.parse(value))
  } catch {
    return initialProgramIds
  }
}

function createDeviceId() {
  const existingId = readStoredValue(DEVICE_STORAGE_KEY)
  if (existingId) return existingId

  const id =
    globalThis.crypto?.randomUUID?.() ??
    `atlasib-${Date.now()}-${Math.random().toString(36).slice(2, 15)}`
  try {
    window.localStorage.setItem(DEVICE_STORAGE_KEY, id)
  } catch {
    return id
  }
  return id
}

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg ?? '请求参数校验失败')
      .join('；')
  }
  const apiError = error?.response?.data?.error
  if (typeof apiError?.message === 'string') {
    const details = Array.isArray(apiError.details)
      ? apiError.details.map((item) => item?.msg).filter(Boolean).join('；')
      : ''
    return details ? `${apiError.message} ${details}` : apiError.message
  }
  return error instanceof Error ? error.message : '请求暂时不可用。'
}

function profileToDiagnosis(profile) {
  return {
    profile_id: profile.id,
    calculated_ib_min: profile.calc_ib_min,
    calculated_ib_max: profile.calc_ib_max,
    reasoning_points: profile.reasoning_points ?? [],
    recommended_programs: profile.recommended_snapshot ?? [],
  }
}

function profileToWizardAnswers(profile) {
  function languageAnswer(language, fallback) {
    const value = language || fallback
    return supportedLanguages.has(value)
      ? { language: value, custom: '' }
      : { language: 'Other', custom: value }
  }

  const primary = languageAnswer(
    profile.primary_language,
    defaultWizardAnswers.primaryLanguage,
  )
  const secondary = languageAnswer(
    profile.secondary_language,
    defaultWizardAnswers.secondaryLanguage,
  )

  return {
    school_level: profile.school_level,
    student_rank: profile.student_rank,
    interest_track: profile.interest_track,
    country_pref: profile.country_pref,
    budget: profile.annual_budget_rmb,
    stay_plan: profile.stay_plan,
    primaryLanguage: primary.language,
    primaryLanguageCustom: primary.custom,
    primaryLanguageConfirmed: true,
    primaryLangLevel:
      profile.primary_lang_level ?? defaultWizardAnswers.primaryLangLevel,
    secondaryLanguage: secondary.language,
    secondaryLanguageCustom: secondary.custom,
    secondaryLanguageConfirmed: true,
    secondaryLangLevel:
      profile.secondary_lang_level ?? defaultWizardAnswers.secondaryLangLevel,
  }
}

export function PlanProvider({ children }) {
  const [currentProfileId, setCurrentProfileId] = useState(() =>
    readStoredValue(PROFILE_STORAGE_KEY),
  )
  const [selectedProgramIds, setSelectedProgramIds] =
    useState(readStoredProgramIds)
  const [activeTab, setActiveTab] = useState('wizard')
  const [wizardAnswers, setWizardAnswers] = useState(defaultWizardAnswers)
  const [diagnosisResult, setDiagnosisResult] = useState(null)
  const [isLoadingSavedPrograms, setIsLoadingSavedPrograms] = useState(false)
  const [isSyncingPrograms, setIsSyncingPrograms] = useState(false)
  const [persistenceError, setPersistenceError] = useState('')
  const [clientDeviceId] = useState(createDeviceId)

  const profileIdRef = useRef(currentProfileId)
  const selectedProgramIdsRef = useRef(selectedProgramIds)
  const syncingRef = useRef(false)
  const skipHydrationForProfileRef = useRef(null)
  const retryModeRef = useRef('load')

  const updateSelectedProgramIds = useCallback((ids) => {
    const normalizedIds = normalizeProgramIds(ids)
    selectedProgramIdsRef.current = normalizedIds
    setSelectedProgramIds(normalizedIds)
    try {
      window.localStorage.setItem(
        PROGRAMS_STORAGE_KEY,
        JSON.stringify(normalizedIds),
      )
    } catch (error) {
      setPersistenceError(`本地志愿缓存失败：${getErrorMessage(error)}`)
    }
    return normalizedIds
  }, [])

  useEffect(() => {
    if (!currentProfileId) return undefined
    if (skipHydrationForProfileRef.current === currentProfileId) {
      skipHydrationForProfileRef.current = null
      return undefined
    }

    let isActive = true
    setIsLoadingSavedPrograms(true)
    setPersistenceError('')

    async function loadProfileState() {
      const results = await Promise.allSettled([
        userProgramApi.getProfile(currentProfileId),
        userProgramApi.getSelectedPrograms(currentProfileId),
      ])
      if (!isActive) return

      const [profileResult, programsResult] = results
      const errors = []

      if (profileResult.status === 'fulfilled') {
        const profile = profileResult.value
        setDiagnosisResult(profileToDiagnosis(profile))
        setWizardAnswers(profileToWizardAnswers(profile))
      } else {
        errors.push(`画像读取失败：${getErrorMessage(profileResult.reason)}`)
      }

      if (programsResult.status === 'fulfilled') {
        const savedPrograms = programsResult.value
        if (Array.isArray(savedPrograms)) {
          updateSelectedProgramIds(
            savedPrograms.map((program) => program.program_id),
          )
        }
      } else {
        errors.push(`云端志愿读取失败：${getErrorMessage(programsResult.reason)}`)
      }

      if (errors.length > 0) setPersistenceError(errors.join('；'))
      retryModeRef.current = errors.length > 0 ? 'load' : null
      setIsLoadingSavedPrograms(false)
    }

    loadProfileState().catch((error) => {
      if (!isActive) return
      setPersistenceError(`读取云端画像失败：${getErrorMessage(error)}`)
      setIsLoadingSavedPrograms(false)
    })

    return () => {
      isActive = false
    }
  }, [currentProfileId, updateSelectedProgramIds])

  const saveProfileId = useCallback(
    async (profileId) => {
      if (typeof profileId !== 'string' || !profileId.trim()) {
        throw new TypeError('Profile ID must be a non-empty string.')
      }

      const normalizedProfileId = profileId.trim()
      profileIdRef.current = normalizedProfileId
      setCurrentProfileId(normalizedProfileId)
      skipHydrationForProfileRef.current = normalizedProfileId

      try {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, normalizedProfileId)
      } catch (error) {
        const message = `画像 ID 本地保存失败：${getErrorMessage(error)}`
        setPersistenceError(message)
        return { success: false, error: message }
      }

      const ids = selectedProgramIdsRef.current
      syncingRef.current = true
      setIsSyncingPrograms(true)
      try {
        await userProgramApi.batchSavePrograms(normalizedProfileId, ids)
        retryModeRef.current = null
        setPersistenceError('')
        return { success: true }
      } catch (error) {
        retryModeRef.current = 'save'
        const message = `画像已创建，但初始志愿同步失败：${getErrorMessage(error)}`
        setPersistenceError(message)
        return { success: false, error: message }
      } finally {
        syncingRef.current = false
        setIsSyncingPrograms(false)
      }
    },
    [],
  )

  const toggleProgram = useCallback(
    async (id) => {
      if (typeof id !== 'string' || !id.trim()) {
        throw new TypeError('Program ID must be a non-empty string.')
      }
      if (syncingRef.current) {
        const reason = '志愿正在同步，请稍后重试。'
        setPersistenceError(reason)
        return { success: false, reason }
      }

      const programId = id.trim()
      const currentIds = selectedProgramIdsRef.current
      const isSelected = currentIds.includes(programId)
      if (isSelected && currentIds.length <= 1) {
        const reason = '至少需保留 1 个志愿专业。'
        setPersistenceError(reason)
        return { success: false, reason }
      }

      const nextIds = isSelected
        ? currentIds.filter((currentId) => currentId !== programId)
        : [...currentIds, programId]

      updateSelectedProgramIds(nextIds)
      const profileId = profileIdRef.current
      if (!profileId) return { success: true }

      syncingRef.current = true
      setIsSyncingPrograms(true)
      setPersistenceError('')
      try {
        if (isSelected) {
          await userProgramApi.removeProgram(profileId, programId)
        } else {
          await userProgramApi.addProgram(profileId, programId)
        }
        retryModeRef.current = null
        return { success: true }
      } catch (error) {
        updateSelectedProgramIds(currentIds)
        retryModeRef.current = 'save'
        const message = `志愿同步失败，已恢复原选择：${getErrorMessage(error)}`
        setPersistenceError(message)
        return { success: false, error: message }
      } finally {
        syncingRef.current = false
        setIsSyncingPrograms(false)
      }
    },
    [updateSelectedProgramIds],
  )

  const batchApplyDiagnosisPrograms = useCallback(
    async (ids) => {
      const programIds = normalizeProgramIds(ids)
      if (programIds.length === 0) {
        return { success: false, reason: '推荐结果中没有可保存的专业。' }
      }
      if (syncingRef.current) {
        const reason = '志愿正在同步，请稍后重试。'
        setPersistenceError(reason)
        return { success: false, reason }
      }

      const previousIds = selectedProgramIdsRef.current
      updateSelectedProgramIds(programIds)
      const profileId = profileIdRef.current
      let result = { success: true }

      if (profileId) {
        syncingRef.current = true
        setIsSyncingPrograms(true)
        setPersistenceError('')
        try {
          await userProgramApi.batchSavePrograms(profileId, programIds)
          retryModeRef.current = null
        } catch (error) {
          updateSelectedProgramIds(previousIds)
          retryModeRef.current = 'save'
          const message = `批量保存志愿失败，已恢复原选择：${getErrorMessage(error)}`
          setPersistenceError(message)
          result = { success: false, error: message }
        } finally {
          syncingRef.current = false
          setIsSyncingPrograms(false)
        }
      }

      setActiveTab('harmonizer')
      return result
    },
    [updateSelectedProgramIds],
  )

  const retryProgramSync = useCallback(async () => {
    const profileId = profileIdRef.current
    if (!profileId) return { success: false, reason: '尚未创建云端画像。' }
    if (syncingRef.current) {
      return { success: false, reason: '志愿正在同步，请稍后重试。' }
    }

    syncingRef.current = true
    if (retryModeRef.current === 'load') {
      setIsLoadingSavedPrograms(true)
      try {
        const [profile, programs] = await Promise.all([
          userProgramApi.getProfile(profileId),
          userProgramApi.getSelectedPrograms(profileId),
        ])
        setDiagnosisResult(profileToDiagnosis(profile))
        setWizardAnswers(profileToWizardAnswers(profile))
        if (Array.isArray(programs)) {
          updateSelectedProgramIds(programs.map((program) => program.program_id))
        }
        retryModeRef.current = null
        setPersistenceError('')
        return { success: true }
      } catch (error) {
        const message = `重试读取云端画像失败：${getErrorMessage(error)}`
        setPersistenceError(message)
        retryModeRef.current = 'load'
        return { success: false, error: message }
      } finally {
        syncingRef.current = false
        setIsLoadingSavedPrograms(false)
      }
    }

    setIsSyncingPrograms(true)
    try {
      await userProgramApi.batchSavePrograms(
        profileId,
        selectedProgramIdsRef.current,
      )
      retryModeRef.current = null
      setPersistenceError('')
      return { success: true }
    } catch (error) {
      const message = `重试同步失败：${getErrorMessage(error)}`
      setPersistenceError(message)
      retryModeRef.current = 'save'
      return { success: false, error: message }
    } finally {
      syncingRef.current = false
      setIsSyncingPrograms(false)
    }
  }, [updateSelectedProgramIds])

  function changeActiveTab(tab) {
    if (!validTabs.has(tab)) {
      throw new RangeError(`Unknown tab: ${tab}`)
    }
    setActiveTab(tab)
  }

  function loadDiagnosisPrograms(ids) {
    return batchApplyDiagnosisPrograms(ids)
  }

  return (
    <PlanContext.Provider
      value={{
        currentProfileId,
        clientDeviceId,
        saveProfileId,
        selectedProgramIds,
        toggleProgram,
        batchApplyDiagnosisPrograms,
        activeTab,
        setActiveTab: changeActiveTab,
        wizardAnswers,
        setWizardAnswers,
        diagnosisResult,
        setDiagnosisResult,
        loadDiagnosisPrograms,
        isLoadingSavedPrograms,
        isSyncingPrograms,
        persistenceError,
        clearPersistenceError: () => setPersistenceError(''),
        retryProgramSync,
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function usePlan() {
  const context = useContext(PlanContext)

  if (context === null) {
    throw new Error('usePlan must be used within a PlanProvider.')
  }

  return context
}
