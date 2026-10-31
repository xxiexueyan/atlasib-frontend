import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import i18n from '../i18n.js'
import { authApi } from '../api/auth.js'
import { userProgramApi } from '../api/userPrograms.js'

const PlanContext = createContext(null)
const PROFILE_STORAGE_KEY = 'atlasib_profile_id'
const PROGRAMS_STORAGE_KEY = 'atlasib_selected_program_ids'
const DEVICE_STORAGE_KEY = 'atlasib_client_device_id'
const EMAIL_STORAGE_KEY = 'atlasib_saved_email'
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
      .map((item) => item?.msg ?? i18n.t('errors.validation_failed'))
      .join(i18n.t('errors.message_separator'))
  }
  const apiError = error?.response?.data?.error
  if (typeof apiError?.message === 'string') {
    const details = Array.isArray(apiError.details)
      ? apiError.details.map((item) => item?.msg).filter(Boolean).join('；')
      : ''
    return details ? `${apiError.message} ${details}` : apiError.message
  }
  return error instanceof Error ? error.message : i18n.t('errors.request_failed')
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

function getActiveScenarioStorageKey(profileId) {
  return `atlasib_active_scenario_${profileId ?? 'guest'}`
}

function readStoredActiveScenario(profileId) {
  try {
    const stored = window.localStorage.getItem(
      getActiveScenarioStorageKey(profileId),
    )
    const scenario = stored ? JSON.parse(stored) : null
    if (
      !scenario ||
      typeof scenario.scenario_id !== 'string' ||
      !Array.isArray(scenario.program_ids) ||
      !Array.isArray(scenario.subjects)
    ) {
      return null
    }
    return scenario
  } catch {
    return null
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
  const [activeScenarioState, setActiveScenario] = useState(() =>
    readStoredActiveScenario(readStoredValue(PROFILE_STORAGE_KEY)),
  )
  const [isLoadingSavedPrograms, setIsLoadingSavedPrograms] = useState(false)
  const [isSyncingPrograms, setIsSyncingPrograms] = useState(false)
  const [persistenceError, setPersistenceError] = useState('')
  const [clientDeviceId] = useState(createDeviceId)
  const [restoreStatus, setRestoreStatus] = useState(() =>
    new URLSearchParams(window.location.search).get('restore_token')
      ? 'syncing'
      : '',
  )
  const [conflictCandidate, setConflictCandidate] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isSessionLoading, setIsSessionLoading] = useState(() =>
    Boolean(readStoredValue('atlasib_session_token')),
  )
  const [sessionRestoreError, setSessionRestoreError] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [profileHydrationVersion, setProfileHydrationVersion] = useState(0)

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
      setPersistenceError(
        i18n.t('app.cache_failed', { error: getErrorMessage(error) }),
      )
    }
    return normalizedIds
  }, [])

  const clearSelectedPrograms = useCallback(() => {
    updateSelectedProgramIds([])
  }, [updateSelectedProgramIds])

  const applyUserData = useCallback(
    (userData) => {
      if (
        !userData ||
        typeof userData.user_id !== 'string' ||
        typeof userData.email !== 'string'
      ) {
        throw new TypeError('The authentication response has invalid user data.')
      }

      const activeProfileId =
        typeof userData.active_profile_id === 'string' &&
        userData.active_profile_id.trim()
          ? userData.active_profile_id.trim()
          : null
      const previousProfileId = profileIdRef.current
      skipHydrationForProfileRef.current = null
      profileIdRef.current = activeProfileId
      setCurrentProfileId(activeProfileId)
      setCurrentUser({ userId: userData.user_id, email: userData.email })
      setDiagnosisResult(null)
      setWizardAnswers(defaultWizardAnswers)
      if (!activeProfileId) setIsLoadingSavedPrograms(false)

      if (previousProfileId && previousProfileId !== activeProfileId) {
        try {
          window.localStorage.removeItem(
            getActiveScenarioStorageKey(previousProfileId),
          )
        } catch {
          console.warn('Could not clear the previous profile scenario cache.')
        }
      }

      try {
        window.localStorage.setItem(EMAIL_STORAGE_KEY, userData.email)
        if (activeProfileId) {
          window.localStorage.setItem(PROFILE_STORAGE_KEY, activeProfileId)
        } else {
          window.localStorage.removeItem(PROFILE_STORAGE_KEY)
        }
      } catch (error) {
        setPersistenceError(
          i18n.t('app.cache_failed', { error: getErrorMessage(error) }),
        )
      }

      const programIds = Array.isArray(userData.selected_program_ids)
        ? userData.selected_program_ids
        : []
      updateSelectedProgramIds(programIds)
      setProfileHydrationVersion((version) => version + 1)

      const scenario = Array.isArray(userData.scenarios)
        ? userData.scenarios.find(
            (item) =>
              item?.scenario_id === userData.active_scenario_id &&
              Array.isArray(item.subjects),
          )
        : null
      if (scenario && activeProfileId) {
        const activeScenario = {
          scenario_id: scenario.scenario_id,
          scenario_name: scenario.name,
          profile_id: activeProfileId,
          program_ids: normalizeProgramIds(programIds),
          subjects: scenario.subjects,
          saved_at: Date.now(),
        }
        setActiveScenario(activeScenario)
        try {
          window.localStorage.setItem(
            getActiveScenarioStorageKey(activeProfileId),
            JSON.stringify(activeScenario),
          )
        } catch (error) {
          setPersistenceError(
            i18n.t('app.cache_failed', { error: getErrorMessage(error) }),
          )
        }
      } else {
        setActiveScenario(null)
        if (activeProfileId) {
          try {
            window.localStorage.removeItem(
              getActiveScenarioStorageKey(activeProfileId),
            )
          } catch (error) {
            setPersistenceError(
              i18n.t('app.cache_failed', { error: getErrorMessage(error) }),
            )
          }
        }
      }
    },
    [updateSelectedProgramIds],
  )

  const restoreSession = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsSessionLoading(true)
      setSessionRestoreError(false)
    }
    const token = readStoredValue('atlasib_session_token')
    if (!token) {
      if (showLoading) {
        setCurrentUser(null)
        setIsSessionLoading(false)
      }
      return { success: true, authenticated: false }
    }

    try {
      const response = await authApi.me()
      if (!response?.success || !response.user) {
        throw new Error('The session response did not contain a user.')
      }
      applyUserData(response.user)
      return { success: true, authenticated: true }
    } catch (error) {
      if (error?.response?.status === 401) {
        try {
          window.localStorage.removeItem('atlasib_session_token')
        } catch {
          console.warn('Could not clear the invalid authentication session.')
        }
        setCurrentUser(null)
        setSessionRestoreError(false)
        return { success: false, authenticated: false }
      }

      setSessionRestoreError(true)
      console.error('Unable to verify the saved login session.')
      return { success: false, authenticated: false }
    } finally {
      setIsSessionLoading(false)
    }
  }, [applyUserData])

  useEffect(() => {
    void Promise.resolve().then(() => restoreSession(false))
  }, [restoreSession])

  const loginWithOtp = useCallback(
    async (email, code, lang = 'en') => {
      const response = await authApi.verifyOtp(
        email,
        code,
        currentProfileId,
        lang,
      )
      if (
        !response?.success ||
        typeof response.session_token !== 'string' ||
        !response.user
      ) {
        throw new Error('The login response is incomplete.')
      }

      window.localStorage.setItem(
        'atlasib_session_token',
        response.session_token,
      )
      applyUserData(response.user)
      setSessionRestoreError(false)
      setIsSessionLoading(false)
      return response
    },
    [applyUserData, currentProfileId],
  )

  const logout = useCallback(async () => {
    let serverLogoutConfirmed = true
    const token = readStoredValue('atlasib_session_token')
    const previousProfileId = profileIdRef.current
    try {
      if (token) {
        const response = await authApi.logout()
        serverLogoutConfirmed = response?.success === true
      }
    } catch {
      serverLogoutConfirmed = false
    } finally {
      for (const key of [
        'atlasib_session_token',
        'atlasib_user_session',
        PROFILE_STORAGE_KEY,
        EMAIL_STORAGE_KEY,
      ]) {
        try {
          window.localStorage.removeItem(key)
        } catch {
          console.warn('Could not fully clear the local login session.')
        }
      }
      profileIdRef.current = null
      setCurrentProfileId(null)
      setDiagnosisResult(null)
      setWizardAnswers(defaultWizardAnswers)
      setActiveScenario(null)
      setCurrentUser(null)
      setSessionRestoreError(false)
      setIsSessionLoading(false)
      try {
        window.localStorage.removeItem(getActiveScenarioStorageKey(null))
        if (previousProfileId) {
          window.localStorage.removeItem(
            getActiveScenarioStorageKey(previousProfileId),
          )
        }
      } catch {
        console.warn('Could not clear the cached active scenario.')
      }
    }

    return { success: serverLogoutConfirmed }
  }, [])

  const clearExpiredProfile = useCallback(
    (profileId) => {
      if (profileIdRef.current !== profileId) return

      console.warn(
        '[Self-Healing] Local profile ID was not found on the server. Clearing stale profile cache.',
      )
      profileIdRef.current = null
      setCurrentProfileId(null)
      setDiagnosisResult(null)
      setWizardAnswers(defaultWizardAnswers)
      setActiveScenario(null)
      setIsLoadingSavedPrograms(false)
      retryModeRef.current = null
      updateSelectedProgramIds(initialProgramIds)
      setPersistenceError('')

      for (const key of [
        PROFILE_STORAGE_KEY,
        EMAIL_STORAGE_KEY,
        getActiveScenarioStorageKey(profileId),
        getActiveScenarioStorageKey(null),
      ]) {
        try {
          window.localStorage.removeItem(key)
        } catch (error) {
          console.warn(
            `[Self-Healing] Could not clear stale cache key "${key}".`,
            error,
          )
        }
      }
    },
    [updateSelectedProgramIds],
  )

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
      const missingProfile =
        (profileResult.status === 'rejected' &&
          profileResult.reason?.response?.status === 404) ||
        (programsResult.status === 'rejected' &&
          programsResult.reason?.response?.status === 404)
      if (missingProfile) {
        clearExpiredProfile(currentProfileId)
        return
      }

      const errors = []

      if (profileResult.status === 'fulfilled') {
        const profile = profileResult.value
        setDiagnosisResult(profileToDiagnosis(profile))
        setWizardAnswers(profileToWizardAnswers(profile))
      } else {
        errors.push(
          i18n.t('app.profile_load_failed', {
            error: getErrorMessage(profileResult.reason),
          }),
        )
      }

      if (programsResult.status === 'fulfilled') {
        const savedPrograms = programsResult.value
        if (Array.isArray(savedPrograms)) {
          updateSelectedProgramIds(
            savedPrograms.map((program) => program.program_id),
          )
        }
      } else {
        errors.push(
          i18n.t('app.programs_load_failed', {
            error: getErrorMessage(programsResult.reason),
          }),
        )
      }

      if (errors.length > 0) {
        setPersistenceError(errors.join(i18n.t('errors.message_separator')))
      }
      retryModeRef.current = errors.length > 0 ? 'load' : null
      setIsLoadingSavedPrograms(false)
    }

    loadProfileState().catch((error) => {
      if (!isActive) return
      if (error?.response?.status === 404) {
        clearExpiredProfile(currentProfileId)
        return
      }
      setPersistenceError(
        i18n.t('app.profile_restore_failed', {
          error: getErrorMessage(error),
        }),
      )
      setIsLoadingSavedPrograms(false)
    })

    return () => {
      isActive = false
    }
  }, [
    clearExpiredProfile,
    currentProfileId,
    profileHydrationVersion,
    updateSelectedProgramIds,
  ])

  const adoptRestoredProfile = useCallback(
    (profileId) => {
      profileIdRef.current = profileId
      setCurrentProfileId(profileId)
      setActiveScenario(readStoredActiveScenario(profileId))
      try {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, profileId)
      } catch (error) {
        setPersistenceError(
          i18n.t('app.profile_id_save_failed', {
            error: getErrorMessage(error),
          }),
        )
      }
    },
    [],
  )

  useEffect(() => {
    const url = new URL(window.location.href)
    const token = url.searchParams.get('restore_token')
    if (!token) return

    // Strip the token right away so it is not kept in history or shared.
    url.searchParams.delete('restore_token')
    window.history.replaceState(
      window.history.state,
      document.title,
      `${url.pathname}${url.search}${url.hash}`,
    )

    userProgramApi
      .restoreSessionByToken(token)
      .then((data) => {
        if (!data?.success || !data.profile_id) {
          throw new Error('Restore rejected.')
        }
        try {
          if (data.email) window.localStorage.setItem(EMAIL_STORAGE_KEY, data.email)
        } catch {
          // The email cache is optional.
        }
        if (Array.isArray(data.selected_program_ids) && data.selected_program_ids.length > 0) {
          updateSelectedProgramIds(data.selected_program_ids)
        }
        const restoredScenario = Array.isArray(data.scenarios)
          ? data.scenarios.find(
              (scenario) =>
                scenario?.scenario_id === data.active_scenario_id &&
                Array.isArray(scenario.subjects),
            )
          : null
        if (restoredScenario) {
          try {
            window.localStorage.setItem(
              getActiveScenarioStorageKey(data.profile_id),
              JSON.stringify({
                scenario_id: restoredScenario.scenario_id,
                scenario_name: restoredScenario.name,
                profile_id: data.profile_id,
                program_ids: normalizeProgramIds(
                  data.selected_program_ids ?? [],
                ),
                subjects: restoredScenario.subjects,
                saved_at: Date.now(),
              }),
            )
          } catch {
            // Restoring the highlighted scenario is best-effort.
          }
        }
        adoptRestoredProfile(data.profile_id)
        if (data.is_conflict_candidate) {
          setConflictCandidate({ email: data.email, restoreToken: token })
        }
        setRestoreStatus('restored')
      })
      .catch(() => setRestoreStatus('failed'))
  }, [adoptRestoredProfile, updateSelectedProgramIds])

  const resolveRestoreConflict = useCallback(
    async (action) => {
      if (!conflictCandidate) return
      const data = await userProgramApi.resolveConflict(
        conflictCandidate.restoreToken,
        action,
      )
      setConflictCandidate(null)
      const activeProfileId = data?.active_profile_id
      if (activeProfileId && activeProfileId !== profileIdRef.current) {
        adoptRestoredProfile(activeProfileId)
        return
      }

      // Same profile: the server data may have changed, so reload it here.
      const profileId = profileIdRef.current
      if (!profileId) return
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
      } catch (error) {
        if (error?.response?.status === 404) {
          setConflictCandidate(null)
          clearExpiredProfile(profileId)
          return
        }
        retryModeRef.current = 'load'
        setPersistenceError(
          i18n.t('app.retry_profile_load_failed', {
            error: getErrorMessage(error),
          }),
        )
      } finally {
        setIsLoadingSavedPrograms(false)
      }
    },
    [
      adoptRestoredProfile,
      clearExpiredProfile,
      conflictCandidate,
      updateSelectedProgramIds,
    ],
  )

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
        const message = i18n.t('app.profile_id_save_failed', {
          error: getErrorMessage(error),
        })
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
        const message = i18n.t('app.initial_sync_failed', {
          error: getErrorMessage(error),
        })
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
        const reason = i18n.t('app.sync_in_progress')
        setPersistenceError(reason)
        return { success: false, reason }
      }

      const programId = id.trim()
      const currentIds = selectedProgramIdsRef.current
      const isSelected = currentIds.includes(programId)
      if (isSelected && currentIds.length <= 1) {
        const reason = i18n.t('app.one_program_required')
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
        const message = i18n.t('app.sync_rolled_back', {
          error: getErrorMessage(error),
        })
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
        return {
          success: false,
          reason: i18n.t('app.no_recommended_programs'),
        }
      }
      if (syncingRef.current) {
        const reason = i18n.t('app.sync_in_progress')
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
          const message = i18n.t('app.batch_sync_rolled_back', {
            error: getErrorMessage(error),
          })
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

  const removeProgramsFromSelection = useCallback(
    async (ids) => {
      const programIds = normalizeProgramIds(ids)
      const currentIds = selectedProgramIdsRef.current
      const idsToRemove = programIds.filter((id) => currentIds.includes(id))
      if (idsToRemove.length === 0) return { success: true }
      if (syncingRef.current) {
        const reason = i18n.t('app.sync_in_progress')
        setPersistenceError(reason)
        return { success: false, reason }
      }

      const nextIds = currentIds.filter((id) => !idsToRemove.includes(id))
      updateSelectedProgramIds(nextIds)
      const profileId = profileIdRef.current
      if (!profileId) return { success: true }

      syncingRef.current = true
      setIsSyncingPrograms(true)
      setPersistenceError('')
      try {
        await Promise.all(
          idsToRemove.map((programId) =>
            userProgramApi.removeProgram(profileId, programId),
          ),
        )
        retryModeRef.current = null
        return { success: true }
      } catch (error) {
        updateSelectedProgramIds(currentIds)
        retryModeRef.current = 'save'
        let message = i18n.t('app.remove_invalid_failed', {
          error: getErrorMessage(error),
        })
        try {
          await userProgramApi.batchSavePrograms(profileId, currentIds)
          message += ' 云端志愿已恢复原选择。'
        } catch (restoreError) {
          message += i18n.t('app.restore_choices_failed', {
            error: getErrorMessage(restoreError),
          })
        }
        setPersistenceError(message)
        return { success: false, error: message }
      } finally {
        syncingRef.current = false
        setIsSyncingPrograms(false)
      }
    },
    [updateSelectedProgramIds],
  )

  const applyScenarioAsActive = useCallback(
    (scenario) => {
      if (!scenario?.scenario_id || !Array.isArray(scenario.subjects)) {
        throw new TypeError('A valid scenario with subjects is required.')
      }
      const payload = {
        scenario_id: scenario.scenario_id,
        scenario_name: scenario.name,
        profile_id: profileIdRef.current,
        program_ids: [...selectedProgramIdsRef.current],
        subjects: scenario.subjects,
        saved_at: Date.now(),
      }

      try {
        window.localStorage.setItem(
          getActiveScenarioStorageKey(profileIdRef.current),
          JSON.stringify(payload),
        )
        setActiveScenario(payload)
        setPersistenceError('')
        return { success: true }
      } catch (error) {
        const message = i18n.t('app.final_plan_save_failed', {
          error: getErrorMessage(error),
        })
        setPersistenceError(message)
        return { success: false, error: message }
      }
    },
    [],
  )

  const activeScenario =
    activeScenarioState?.profile_id === currentProfileId
      ? activeScenarioState
      : readStoredActiveScenario(currentProfileId)
  const activeScenarioIsStale =
    Boolean(activeScenario) &&
    (activeScenario.program_ids.length !== selectedProgramIds.length ||
      activeScenario.program_ids.some(
        (programId) => !selectedProgramIds.includes(programId),
      ))

  const retryProgramSync = useCallback(async () => {
    const profileId = profileIdRef.current
    if (!profileId) {
      return { success: false, reason: i18n.t('app.profile_not_created') }
    }
    if (syncingRef.current) {
      return { success: false, reason: i18n.t('app.sync_in_progress') }
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
        if (error?.response?.status === 404) {
          clearExpiredProfile(profileId)
          return { success: true }
        }
        const message = i18n.t('app.retry_profile_load_failed', {
          error: getErrorMessage(error),
        })
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
      const message = i18n.t('app.retry_sync_failed', {
        error: getErrorMessage(error),
      })
      setPersistenceError(message)
      retryModeRef.current = 'save'
      return { success: false, error: message }
    } finally {
      syncingRef.current = false
      setIsSyncingPrograms(false)
    }
  }, [clearExpiredProfile, updateSelectedProgramIds])

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
        currentUser,
        loginWithOtp,
        logout,
        restoreSession,
        isSessionLoading,
        sessionRestoreError,
        isAuthModalOpen,
        setIsAuthModalOpen,
        currentProfileId,
        clientDeviceId,
        saveProfileId,
        selectedProgramIds,
        clearSelectedPrograms,
        toggleProgram,
        batchApplyDiagnosisPrograms,
        activeTab,
        setActiveTab: changeActiveTab,
        wizardAnswers,
        setWizardAnswers,
        diagnosisResult,
        setDiagnosisResult,
        activeScenario,
        activeScenarioIsStale,
        applyScenarioAsActive,
        removeProgramsFromSelection,
        loadDiagnosisPrograms,
        isLoadingSavedPrograms,
        isSyncingPrograms,
        persistenceError,
        clearPersistenceError: () => setPersistenceError(''),
        retryProgramSync,
        restoreStatus,
        dismissRestoreStatus: () => setRestoreStatus(''),
        conflictCandidate,
        dismissConflict: () => setConflictCandidate(null),
        resolveRestoreConflict,
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
