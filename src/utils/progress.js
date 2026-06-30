// Shared progress-by-course calculation — used by StudentDashboard and StudentCoursesPage
// so the two views can never drift out of sync.
export async function calculateProgressByCourse(supabase, userId, courseIds) {
  if (!courseIds || courseIds.length === 0) return {}

  const { data: modData } = await supabase
    .from('modules')
    .select('course_id, lessons(id)')
    .in('course_id', courseIds)

  const lessonCountByCourse = {}
  const lessonToCourse = {}
  for (const mod of (modData || [])) {
    for (const lesson of (mod.lessons || [])) {
      lessonToCourse[lesson.id] = mod.course_id
      lessonCountByCourse[mod.course_id] = (lessonCountByCourse[mod.course_id] || 0) + 1
    }
  }

  const allLessonIds = Object.keys(lessonToCourse)
  let completedSet = new Set()
  if (allLessonIds.length > 0) {
    const { data: lpData } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('student_id', userId)
      .eq('completed', true)
      .in('lesson_id', allLessonIds)
    completedSet = new Set((lpData || []).map(p => p.lesson_id))
  }

  const completedByCourse = {}
  for (const [lid, cid] of Object.entries(lessonToCourse)) {
    if (completedSet.has(lid)) completedByCourse[cid] = (completedByCourse[cid] || 0) + 1
  }

  const progressByCourse = {}
  for (const cid of courseIds) {
    const total = lessonCountByCourse[cid] || 0
    const done  = completedByCourse[cid]  || 0
    progressByCourse[cid] = total > 0 ? Math.round((done / total) * 100) : 0
  }

  return progressByCourse
}
