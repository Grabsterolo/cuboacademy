import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useCourseWizard } from './course-wizard/useCourseWizard'
import { WizardProgress } from './course-wizard/components/WizardProgress'
import { IC } from './course-wizard/components/shared'
import { Step1Info } from './course-wizard/steps/Step1Info'
import { Step2Structure } from './course-wizard/steps/Step2Structure'
import { Step3Content } from './course-wizard/steps/Step3Content'
import { Step4Evaluation } from './course-wizard/steps/Step4Evaluation'
import { Step5Certificate } from './course-wizard/steps/Step5Certificate'
import { Step6Pricing } from './course-wizard/steps/Step6Pricing'
import { Step7Preview } from './course-wizard/steps/Step7Preview'
import { Step8Publish } from './course-wizard/steps/Step8Publish'

export default function CourseWizardPage() {
  const {
    step, setStep, completed, isEdit, loading, saving, error, setError, courseId,
    info, setInfo, imgUploading, imgErr, handleImgUpload,
    categories, instructors, isAdmin,
    modules, setModules,
    evalData, setEvalData,
    cert, setCert, pricing, setPricing,
    pubStatus, setPubStatus, pubError,
    navigate,
    handleNext, handleBack, handleSaveStep, handleDraft, handleReview,
  } = useCourseWizard()

  // ── render ────────────────────────────────────────────────────────────────
  function renderStep() {
    switch (step) {
      case 1: return <Step1Info info={info} onChange={(k, v) => setInfo(i => ({ ...i, [k]: v }))} categories={categories} instructors={instructors} isAdmin={isAdmin} imgUploading={imgUploading} imgErr={imgErr} onImgUpload={handleImgUpload} />
      case 2: return <Step2Structure modules={modules} setModules={setModules} />
      case 3: return <Step3Content modules={modules} setModules={setModules} />
      case 4: return <Step4Evaluation eval={evalData} setEval={setEvalData} />
      case 5: return <Step5Certificate cert={cert} setCert={setCert} />
      case 6: return <Step6Pricing pricing={pricing} setPricing={setPricing} />
      case 7: return <Step7Preview info={info} modules={modules} eval={evalData} cert={cert} pricing={pricing} />
      case 8: return <Step8Publish status={pubStatus} setStatus={setPubStatus} saving={saving} error={pubError} onDraft={handleDraft} onReview={handleReview} isAdmin={isAdmin} />
      default: return null
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '.6rem', color: 'var(--text-2)', fontFamily: 'var(--sans)', fontSize: '.9rem' }}>
          <div style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--jade)', borderRadius: '50%', animation: 'wiz-spin .7s linear infinite' }} />
          Cargando curso…
        </div>
        <style>{`@keyframes wiz-spin { to { transform: rotate(360deg); } }`}</style>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <style>{`
        @keyframes wiz-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .wiz-pad { padding: 1.25rem 1rem 3rem !important; }
          .wiz-grid { grid-template-columns: 1fr !important; }
          .wiz-step-label { display: none !important; }
        }
      `}</style>

      <div className="wiz-pad" style={{ padding: '2.5rem 2.5rem 3rem', maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>
              {isAdmin ? 'Gestión' : 'Instructor'}
            </p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>
              {isEdit ? 'Editando curso' : 'Nuevo curso'}
            </h1>
            {isEdit && info.title && (
              <p style={{ fontSize: '.84rem', color: 'var(--text-2)', margin: '.3rem 0 0' }}>{info.title}</p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', flexShrink: 0 }}>
            {courseId && (
              <span style={{ fontSize: '.72rem', color: 'var(--jade)', display: 'flex', alignItems: 'center', gap: '.35rem', background: 'var(--jade-soft)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(22,125,120,.2)' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--jade)"><circle cx="12" cy="12" r="10"/></svg>
                Guardado
              </span>
            )}
            <button type="button" onClick={() => navigate('cursos')}
              style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '.5rem 1rem', cursor: 'pointer', fontSize: '.8rem', color: 'var(--text-2)', fontFamily: 'var(--sans)', transition: 'border-color .15s, color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--jade)'; e.currentTarget.style.color = 'var(--jade)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver
            </button>
          </div>
        </div>

        {/* Step progress */}
        <WizardProgress step={step} completed={completed} isEdit={isEdit} onStepClick={n => { setError(''); setStep(n) }} />

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 9, padding: '.75rem 1.1rem', fontSize: '.84rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}

        {/* Step content */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '2rem 2.25rem 2.25rem' }}>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.1rem', gap: '.6rem' }}>
          {step > 1 ? (
            <button type="button" onClick={handleBack} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.65rem 1.2rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.875rem', fontWeight: 500, color: 'var(--carbon)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              {IC.arrowL} Anterior
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: '.6rem' }}>
            {isEdit && step < 8 && (
              <button type="button" onClick={handleSaveStep} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.65rem 1.2rem', background: 'white', border: '1px solid var(--jade)', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, color: 'var(--jade)', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: saving ? .65 : 1 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--jade-soft)'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                {saving ? 'Guardando…' : 'Guardar paso'}
              </button>
            )}
            {step < 8 && (
              <button type="button" onClick={handleNext} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: saving ? .65 : 1 }}>
                {saving ? (
                  <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'wiz-spin .7s linear infinite' }} /> Guardando…</>
                ) : (
                  <>{isEdit ? 'Guardar y continuar' : 'Siguiente'} {IC.arrowR}</>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
