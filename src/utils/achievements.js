// Canonical achievement definitions — shared by StudentDashboard and StudentAchievementsPage
// so the two views can never drift out of sync.
export const ACHIEVEMENTS = [
  {
    id: 'primer_paso',
    title: 'Primer paso',
    req: 'Inscríbete en 1 curso',
    check: (n) => n >= 1,
    desc: () => 'Te inscribiste en tu primer curso.',
  },
  {
    id: 'curioso',
    title: 'Aprendiz curioso',
    req: 'Inscríbete en 3 cursos',
    check: (n) => n >= 3,
    desc: (n) => `Alcanzaste 3 inscripciones (${Math.min(n, 3)}/3).`,
  },
  {
    id: 'dedicado',
    title: 'Dedicado',
    req: 'Completa 1 curso',
    check: (n, c) => c >= 1,
    desc: () => 'Completaste tu primer curso.',
  },
  {
    id: 'maestro',
    title: 'Maestro del conocimiento',
    req: 'Completa 3 cursos',
    check: (n, c) => c >= 3,
    desc: (n, c) => `Completaste 3 cursos (${Math.min(c, 3)}/3).`,
  },
]
