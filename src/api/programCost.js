const currencyByCountry = {
  AUS: 'AUD',
  CAN: 'CAD',
  CHE: 'CHF',
  DEU: 'EUR',
  FRA: 'EUR',
  GBR: 'GBP',
  IRL: 'EUR',
  JPN: 'JPY',
  NLD: 'EUR',
  SGP: 'SGD',
  USA: 'USD',
}

const currencyByCountryName = {
  australia: 'AUD',
  澳大利亚: 'AUD',
  canada: 'CAD',
  加拿大: 'CAD',
  germany: 'EUR',
  德国: 'EUR',
  france: 'EUR',
  法国: 'EUR',
  ireland: 'EUR',
  爱尔兰: 'EUR',
  netherlands: 'EUR',
  荷兰: 'EUR',
  switzerland: 'CHF',
  瑞士: 'CHF',
  japan: 'JPY',
  日本: 'JPY',
  singapore: 'SGD',
  新加坡: 'SGD',
  'united kingdom': 'GBP',
  英国: 'GBP',
  'united states': 'USD',
  美国: 'USD',
}

function parseAmount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string' || !value.trim()) return null
  const amount = Number(value.replaceAll(',', '').trim())
  return Number.isFinite(amount) ? amount : null
}

function getCurrency(program) {
  const explicitCurrency =
    program.currency_code ??
    program.currency ??
    program.tuition_currency ??
    program.local_currency
  if (typeof explicitCurrency === 'string' && explicitCurrency.trim()) {
    return explicitCurrency.trim().toUpperCase()
  }

  const countryId = String(program.country_id ?? program.country_code ?? '')
    .trim()
    .toUpperCase()
  if (currencyByCountry[countryId]) return currencyByCountry[countryId]

  const countryName = String(
    program.country_name ?? program.countryName ?? program.country ?? '',
  )
    .trim()
    .toLocaleLowerCase()
  return currencyByCountryName[countryName] ?? null
}

export function getLocalAnnualTuition(program) {
  const currency = getCurrency(program)
  if (!currency) return null

  const tuition = parseAmount(
    program.tuition_local_per_year ?? program.tuitionLocalPerYear,
  )

  return tuition === null ? null : { amount: tuition, currency }
}

export function formatLocalAnnualTuition(
  program,
  t,
  locale = 'zh-CN',
) {
  const tuition = getLocalAnnualTuition(program)
  if (!tuition) {
    return t ? t('programs.no_tuition') : '暂无学费数据'
  }

  const amount = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(tuition.amount)
  const approximate = t ? t('common.approx') : '约'
  const year = t ? t('common.year') : '/ 年'
  return `${approximate} ${amount} ${tuition.currency} ${year}`
}
