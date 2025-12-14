export const saveJSON = (key, obj) => {
  try { localStorage.setItem(key, JSON.stringify(obj)) } catch {}
}
export const loadJSON = (key, defVal) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : defVal
  } catch { return defVal }
}
export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function toCSV(rows) {
  if (!rows || rows.length === 0) return ''
  const keys = Object.keys(rows[0])
  const header = keys.join(',')
  const lines = rows.map(r => keys.map(k => r[k]).join(','))
  return [header, ...lines].join('\n')
}
