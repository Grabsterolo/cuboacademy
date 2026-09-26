-- STORAGE-001 (MEDIUM) — subida anónima sin límite de tipo ni de tamaño.
--
-- El bucket `instructor-documents` recibe el CV de quien se postula a
-- instructor. Como esa persona todavía no tiene cuenta, la política INSERT es
-- necesariamente abierta:
--
--     «Cualquiera sube documento de solicitud» → check: bucket_id = 'instructor-documents'
--
-- Eso está bien. El problema es que el bucket tenía `file_size_limit` y
-- `allowed_mime_types` en NULL, es decir: cualquier anónimo podía subir
-- archivos de cualquier tipo y de cualquier tamaño, tantos como quisiera, al
-- almacenamiento del proyecto.
--
-- La restricción existía solo en el navegador (InstructorApplicationPage.jsx,
-- líneas 117-118: `file.type !== 'application/pdf'` y `file.size > 8 MB`), y una
-- comprobación en el cliente no es una restricción — la subida va directa al
-- endpoint de Storage, no pasa por ese código.
--
-- El arreglo es mover al bucket exactamente los mismos límites que ya declara
-- el formulario, para que valgan de verdad. No cambia nada para quien se
-- postula: sigue subiendo su PDF de hasta 8 MB.
--
-- El bucket es privado (`public: false`) y solo el admin puede leerlo; eso ya
-- estaba correcto y no se toca.

update storage.buckets
set file_size_limit  = 8388608,                      -- 8 MB, como el formulario
    allowed_mime_types = array['application/pdf']    -- como el formulario
where id = 'instructor-documents';
