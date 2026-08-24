import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'No autorizado' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !caller) return json({ error: 'No autorizado' }, 401);

  // Service-role client: never exposed to the browser. Used for the role
  // check, reading cert/course/profile data, writing the PDF to storage,
  // and approving the certificate row.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile, error: callerProfileErr } = await adminClient
    .from('profiles').select('role, full_name').eq('id', caller.id).single();
  if (callerProfileErr || callerProfile?.role !== 'admin') {
    return json({ error: 'Solo un administrador puede aprobar certificados.' }, 403);
  }

  let body: { certificateId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }
  const { certificateId } = body;
  if (!certificateId) return json({ error: 'Falta certificateId.' }, 400);

  const { data: cert, error: certErr } = await adminClient
    .from('certificates')
    .select(`
      id, unique_code, status, student_id, admin_notes,
      profiles!student_id(full_name),
      courses!course_id(title, certificate_name, type, profiles!instructor_id(full_name))
    `)
    .eq('id', certificateId)
    .single();

  if (certErr || !cert) return json({ error: 'Certificado no encontrado.' }, 404);

  // Volver a llamar sobre un certificado ya aprobado es una regeneración: el
  // PDF se reescribe con los datos actuales de curso y perfil. Es la vía para
  // corregir una errata o un nombre desactualizado ya impreso.
  const isRegeneration = cert.status === 'approved';

  const isEvent = cert.courses?.type === 'event';
  const studentName = cert.profiles?.full_name || 'Estudiante';
  const courseName = cert.courses?.certificate_name || cert.courses?.title || (isEvent ? 'Evento' : 'Curso');
  const instructorName = cert.courses?.profiles?.full_name || 'Cubo Campus';
  const now = new Date();

  // ---- generate the PDF ----
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape, points
  const { width, height } = page.getSize();

  const serifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const serif     = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const sans      = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sansBold  = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const jade   = rgb(22 / 255, 125 / 255, 120 / 255);
  const carbon = rgb(0.09, 0.125, 0.121);
  const grey   = rgb(0.42, 0.41, 0.38);
  const cream  = rgb(0.965, 0.953, 0.933);

  page.drawRectangle({ x: 0, y: 0, width, height, color: cream });
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: jade, borderWidth: 2 });
  page.drawRectangle({ x: 32, y: 32, width: width - 64, height: height - 64, borderColor: jade, borderWidth: 0.75 });

  // logo mark: nested squares, matching the app's own sidebar logo
  const logoX = width / 2 - 14, logoY = height - 112;
  page.drawRectangle({ x: logoX, y: logoY, width: 28, height: 28, borderColor: jade, borderWidth: 1.5 });
  page.drawRectangle({ x: logoX + 9, y: logoY + 9, width: 10, height: 10, color: jade });

  function centerTextAt(text: string, centerX: number, y: number, font: typeof serifBold, size: number, color = carbon) {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: centerX - w / 2, y, size, font, color });
  }
  const centerText = (text: string, y: number, font: typeof serifBold, size: number, color = carbon) =>
    centerTextAt(text, width / 2, y, font, size, color);

  centerText('CUBO CAMPUS', height - 145, sansBold, 11, jade);
  centerText(isEvent ? 'Certificado de Participación' : 'Certificado de Finalización', height - 185, serifBold, 27, carbon);

  centerText('Se otorga el presente certificado a', height - 235, serif, 13, grey);
  centerText(studentName, height - 273, serifBold, 30, jade);

  centerText(isEvent ? 'por haber participado en el evento' : 'por haber completado exitosamente el curso', height - 315, serif, 13, grey);
  centerText(courseName, height - 345, serifBold, 18, carbon);

  page.drawLine({
    start: { x: width / 2 - 90, y: height - 372 },
    end:   { x: width / 2 + 90, y: height - 372 },
    thickness: 1, color: jade,
  });

  // Footer: three evenly-spaced columns, each centered on its own zone
  // (rather than left-aligned at ad-hoc x offsets) for a balanced, symmetric row.
  const footerLabelY = height - 445;
  const footerValueY = footerLabelY - 22;
  const contentLeft = 90, contentRight = width - 90;
  const zoneWidth = (contentRight - contentLeft) / 3;
  const col1 = contentLeft + zoneWidth * 0.5;
  const col2 = contentLeft + zoneWidth * 1.5;
  const col3 = contentLeft + zoneWidth * 2.5;

  centerTextAt('INSTRUCTOR', col1, footerLabelY, sansBold, 8, grey);
  centerTextAt(instructorName, col1, footerValueY, serif, 12, carbon);

  centerTextAt('FECHA', col2, footerLabelY, sansBold, 8, grey);
  const dateStr = now.toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' });
  centerTextAt(dateStr, col2, footerValueY, serif, 12, carbon);

  centerTextAt('CÓDIGO DE VERIFICACIÓN', col3, footerLabelY, sansBold, 8, grey);
  centerTextAt(cert.unique_code, col3, footerValueY, sans, 12, carbon);

  const pdfBytes = await pdfDoc.save();

  const filePath = `${cert.id}.pdf`;
  const { error: uploadErr } = await adminClient.storage
    .from('certificates')
    .upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
  if (uploadErr) return json({ error: 'Error al subir el PDF: ' + uploadErr.message }, 500);

  const { data: urlData } = adminClient.storage.from('certificates').getPublicUrl(filePath);
  // El PDF se sobrescribe en la misma ruta, así que la URL no cambia y los
  // navegadores pueden servir la copia vieja de caché. El parámetro no lo lee
  // Storage; solo obliga a pedirlo de nuevo tras una regeneración.
  const publicUrl = `${urlData.publicUrl}?v=${now.getTime()}`;

  const patch: Record<string, unknown> = {
    status: 'approved',
    approved_at: now.toISOString(),
    approved_by: caller.id,
    pdf_url: publicUrl,
  };

  // Rastro de quién regeneró y cuándo. Se acumula en vez de reemplazar, para
  // no borrar notas previas del admin ni regeneraciones anteriores.
  if (isRegeneration) {
    const who = callerProfile?.full_name || caller.email || caller.id;
    const stamp = `Regenerado por ${who} el ${now.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })}.`;
    patch.admin_notes = cert.admin_notes ? `${cert.admin_notes}\n${stamp}` : stamp;
  }

  const { error: updateErr } = await adminClient
    .from('certificates')
    .update(patch)
    .eq('id', certificateId);
  if (updateErr) return json({ error: 'El PDF se generó pero no se pudo aprobar el certificado: ' + updateErr.message }, 500);

  // En una regeneración no se manda correo: el estudiante ya fue avisado
  // cuando se aprobó, y repetirlo por una corrección tipográfica sería ruido.
  if (!isRegeneration) {
    // Best-effort transactional email — never blocks the approval response.
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: cert.student_id,
          type: 'certificate',
          subject: 'Tu certificado está listo',
          message: `Tu certificado ${isEvent ? 'del evento' : 'del curso'} "${courseName}" fue aprobado y ya está disponible para descargar en Cubo Campus.`,
        }),
      });
    } catch { /* non-blocking */ }
  }

  return json({ pdfUrl: publicUrl, regenerated: isRegeneration }, 200);
});
