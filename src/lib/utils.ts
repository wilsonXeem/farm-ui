export const fmt = (n: number) =>
  '₦' + Math.round(n).toLocaleString('en-NG')

export const fmtN = (n: number) =>
  Math.round(n).toLocaleString('en-NG')

export const today = () =>
  new Date().toISOString().split('T')[0]

export const getLast7Days = (): string[] => {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export const getInitials = (name: string) =>
  name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()

export const currentMonth = () =>
  new Date().toISOString().slice(0, 7)
