/**
 * Da de alta a los asistentes de una certificación presencial y les deja el
 * certificado listo.
 *
 * Existe porque el panel obliga a repetir el mismo formulario una vez por
 * persona, y una certificación presencial llega siempre en lote. Hace lo mismo
 * que harías a mano —crear la cuenta, inscribir, marcar asistencia, aprobar—,
 * en el mismo orden y por las mismas vías.
 *
 * Dos cosas que NO hace, a propósito:
 *
 *   · No crea orden de compra. La matrícula deja constancia de quién asistió;
 *     las ventas siguen contando solo lo que pasó por la plataforma.
 *   · No manda ningún correo. Nadie se entera de que tiene cuenta ni
 *     certificado hasta que se lo digas vos.
 *
 * Uso — la clave y el script tienen que ir en el mismo comando, porque cada
 * línea que corrés arranca un shell nuevo y un `export` suelto se pierde:
 *
 *   read -rsp "key: " K && echo && SUPABASE_SERVICE_ROLE_KEY="$K" \
 *     node scripts/provisionar-certificacion.mjs --dry-run
 *
 * Si lo vas a correr varias veces, sale más cómodo dejar la clave en `.env`
 * —que está en .gitignore— como `SUPABASE_SERVICE_ROLE_KEY=...`: este script la
 * lee de ahí si no la encuentra en el entorno.
 *
 * La clave service_role está en Supabase → Project Settings → API. Salta todas
 * las políticas RLS. Nunca le pongas el prefijo VITE_: Vite mete esas variables
 * en el bundle público y quedaría a la vista de cualquiera.
 *
 * Para la siguiente certificación basta cambiar EVENTO y PERSONAS.
 */

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'

// ─── Qué se va a cargar ───────────────────────────────────────────────────────

const EVENTO = '4eb5d0a3-290b-4f41-aefa-aa5c73e17635' // I Certificación Cubo Feedback

const PERSONAS = [
  { nombre: 'Francisco Redondo Brenes',   correo: 'redondofrank@gmail.com' },
  { nombre: 'Carolina Hernández Cubillo', correo: 'chernandez@lincoln.ed.cr' },
  { nombre: 'Andrea Mack Matos',          correo: 'amack@lincoln.ed.cr' },
  { nombre: 'Dayana Cordero Castillo',    correo: 'dayana@eiecr.com' },
  { nombre: 'Lorna Peraza Borbón',        correo: 'lornaperaza@gmail.com' },
  { nombre: 'Keila Castro Vargas',        correo: 'keila@eiecr.com' },
  { nombre: 'Karen Corella Molina',       correo: 'karen.corella@eiecr.com' },
]

// ─── Preparación ──────────────────────────────────────────────────────────────

/** Lee una variable de `.env` sin arrastrar una dependencia para esto solo. */
function desdeEnvFile(nombre) {
  try {
    const linea = readFileSync(new URL('../.env', import.meta.url), 'utf8')
      .split('\n').find(l => l.trim().startsWith(`${nombre}=`))
    return linea?.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') || null
  } catch {
    return null
  }
}

const URL_BASE = process.env.SUPABASE_URL || desdeEnvFile('VITE_SUPABASE_URL')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || desdeEnvFile('SUPABASE_SERVICE_ROLE_KEY')
const DRY = process.argv.includes('--dry-run')

if (!KEY) {
  console.error('Falta SUPABASE_SERVICE_ROLE_KEY, ni en el entorno ni en .env.')
  console.error('Ver el encabezado de este archivo: la clave y el script van en el mismo comando.')
  process.exit(1)
}
if (!URL_BASE) {
  console.error('Falta la URL del proyecto: poné SUPABASE_URL, o VITE_SUPABASE_URL en .env.')
  process.exit(1)
}

const db = createClient(URL_BASE, KEY, { auth: { persistSession: false, autoRefreshToken: false } })

// Contraseña temporal por persona. Se imprime una sola vez al final: no queda
// guardada en ningún lado, así que si se pierde hay que usar «olvidé mi
// contraseña» —que necesita el Site URL de Auth bien puesto—.
const generarClave = () => randomBytes(9).toString('base64url')

const resumen = []

// ─── Comprobaciones antes de tocar nada ───────────────────────────────────────

const { data: evento, error: errEvento } = await db
  .from('courses')
  .select('id, title, type, status, capacity, has_certificate, certificate_condition')
  .eq('id', EVENTO)
  .single()

if (errEvento || !evento) {
  console.error('No se encontró el evento:', errEvento?.message || EVENTO)
  process.exit(1)
}

console.log(`\nEvento: ${evento.title}  (${evento.status}, cupo ${evento.capacity ?? '—'})`)

// El certificado no lo crea este script: lo crea un trigger de la base cuando
// `completed_at` pasa de nulo a no nulo, y solo si el curso cumple estas dos
// condiciones. Sin ellas, marcar asistencia no genera nada y el script estaría
// prometiendo algo que no va a pasar.
if (!evento.has_certificate || evento.certificate_condition !== 'complete') {
  console.error('\nEste evento no emite certificado automáticamente:')
  console.error(`  has_certificate = ${evento.has_certificate}, certificate_condition = ${evento.certificate_condition}`)
  console.error('Se esperaba true y "complete". Revisa el paso de certificado en el asistente del evento.')
  process.exit(1)
}

const { count: yaInscritos } = await db
  .from('enrollments')
  .select('id', { count: 'exact', head: true })
  .eq('course_id', EVENTO)

if (evento.capacity && (yaInscritos || 0) + PERSONAS.length > evento.capacity) {
  console.error(`\nNo caben: hay ${yaInscritos} inscritos, se van a añadir ${PERSONAS.length} y el cupo es ${evento.capacity}.`)
  console.error('Súbele el cupo al evento antes de seguir; el trigger de capacidad rechazaría las últimas matrículas.')
  process.exit(1)
}

if (DRY) console.log('\n── SIMULACRO: no se escribe nada ──')
console.log('')

// ─── Una persona a la vez ─────────────────────────────────────────────────────

for (const persona of PERSONAS) {
  const correo = persona.correo.trim().toLowerCase()
  const fila = { ...persona, correo, id: null, clave: null, estado: '' }
  process.stdout.write(`${persona.nombre.padEnd(28)} `)

  try {
    // 1. Cuenta
    const { data: existente } = await db
      .from('profiles').select('id, role').eq('email', correo).maybeSingle()

    let perfilId = existente?.id
    if (perfilId) {
      fila.estado = 'cuenta ya existía'
    } else if (DRY) {
      fila.estado = 'crearía cuenta'
    } else {
      const clave = generarClave()
      // `email_confirm: true` la da por verificada: nadie va a hacer clic en un
      // correo de confirmación que hoy no se entrega.
      const { data: creado, error } = await db.auth.admin.createUser({
        email: correo,
        password: clave,
        email_confirm: true,
        user_metadata: { full_name: persona.nombre },
      })
      if (error) throw new Error(`crear cuenta: ${error.message}`)
      perfilId = creado.user.id
      fila.clave = clave
      fila.estado = 'cuenta creada'
      // El perfil lo escribe el trigger `on_auth_user_created` dentro de la
      // misma transacción, así que ya está cuando la llamada vuelve.
    }

    fila.id = perfilId

    if (DRY) { fila.estado += ', inscribiría y marcaría asistencia'; resumen.push(fila); console.log(fila.estado); continue }

    // 2. Matrícula — sin orden de compra, a propósito
    let { data: matricula } = await db
      .from('enrollments').select('id, completed_at')
      .eq('course_id', EVENTO).eq('student_id', perfilId).maybeSingle()

    if (!matricula) {
      const { data: nueva, error } = await db
        .from('enrollments')
        .insert({ student_id: perfilId, course_id: EVENTO, enrolled_at: new Date().toISOString() })
        .select('id, completed_at').single()
      if (error) throw new Error(`inscribir: ${error.message}`)
      matricula = nueva
      fila.estado += fila.estado ? ', inscrito' : 'inscrito'
    } else {
      fila.estado += ', ya estaba inscrito'
    }

    // 3. Asistencia. Tiene que ser un UPDATE posterior al INSERT: el trigger
    // que crea el certificado escucha el cambio de `completed_at`, así que
    // insertar la matrícula ya completada no generaría nada.
    if (!matricula.completed_at) {
      const { error } = await db
        .from('enrollments')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', matricula.id)
      if (error) throw new Error(`marcar asistencia: ${error.message}`)
      fila.estado += ', asistencia marcada'
    } else {
      fila.estado += ', asistencia ya estaba'
    }
  } catch (e) {
    fila.estado = `ERROR — ${e.message}`
  }

  resumen.push(fila)
  console.log(fila.estado)
}

// ─── Certificados ─────────────────────────────────────────────────────────────

if (!DRY) {
  const { data: pendientes } = await db
    .from('certificates')
    .select('id, student_id, unique_code, status')
    .eq('course_id', EVENTO).eq('status', 'pending')

  console.log(`\nCertificados pendientes de aprobar: ${pendientes?.length || 0}`)

  for (const cert of pendientes || []) {
    // El PDF lo genera y sube `approve-certificate` con el service role; poner
    // `status = 'approved'` a mano dejaría el certificado sin documento.
    const { data, error } = await db.functions.invoke('approve-certificate', {
      body: { certificateId: cert.id },
    })
    const quien = resumen.find(r => r.id === cert.student_id)?.nombre || cert.unique_code
    console.log(`  ${(error || data?.error) ? '✗' : '✓'} ${quien}${(error || data?.error) ? ` — ${data?.error || error.message}` : ''}`)
  }
}

// ─── Qué pasó ─────────────────────────────────────────────────────────────────

console.log('\n─── Resumen ───')
for (const r of resumen) console.log(`${r.nombre.padEnd(28)} ${r.estado}`)

const conClave = resumen.filter(r => r.clave)
if (conClave.length) {
  console.log('\nContraseñas temporales — se muestran una sola vez, pasáselas por un canal privado')
  console.log('y pediles que las cambien al entrar:\n')
  for (const r of conClave) console.log(`  ${r.correo.padEnd(30)} ${r.clave}`)
}

console.log('\nRecordá: la plataforma no les avisó de nada. El aviso se los mandás vos.')
