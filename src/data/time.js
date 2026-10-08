// October 2026 timestamp with the Madrid offset (daylight saving ends on 25 Oct).
export const t = (day, time) => `2026-10-${String(day).padStart(2, '0')}T${time}:00+02:00`
