export function isElectron() {
  return !!(typeof window !== 'undefined' && window.electron)
}

export function isNative() {
  return !!(typeof window !== 'undefined' && window.Capacitor)
}

export function isWeb() {
  return !isElectron() && !isNative()
}
