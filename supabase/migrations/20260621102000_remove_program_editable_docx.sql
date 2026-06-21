-- Elimina el DOCX editable del registro publico de recursos JAP.
-- El PDF completo del programa queda como recurso publico vigente.

delete from public.recursos
where url = 'assets/docs/programa-anual-jap-2026-2027-editable.docx';
