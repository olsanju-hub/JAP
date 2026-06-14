import { getSupabaseClient, hasSupabaseConfig, loadJapConfig } from "./supabase-client.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const DEFAULT_MODALITY = "Preferentemente presencial, con opción online por Teams";
const DEFAULT_TEAMS = "Enlace Teams pendiente de confirmar";
const DELETE_MESSAGE = "¿Seguro que quieres borrar este elemento? No se eliminará definitivamente, pero dejará de mostrarse públicamente.";
const PERMANENT_DELETE_WORD = "ELIMINAR";
const PERSON_ROLE_LABELS = {
  organizador: "organizador/coordinador",
  ponente: "ponente",
  apoyo: "apoyo docente"
};
const SITE_SETTING_DEFINITIONS = [
  { key: "home.title", group: "Inicio", label: "Título principal", type: "textarea", description: "Título visible en la portada." },
  { key: "home.subtitle", group: "Inicio", label: "Subtítulo", type: "textarea", description: "Texto destacado bajo el título principal." },
  { key: "home.description", group: "Inicio", label: "Descripción", type: "textarea", description: "Descripción breve de las jornadas." },
  { key: "home.primary_button", group: "Inicio", label: "Botón principal", type: "text", description: "Texto del botón principal de la portada." },
  { key: "home.secondary_button_sessions", group: "Inicio", label: "Botón sesiones", type: "text", description: "Texto del acceso rápido a sesiones." },
  { key: "home.secondary_button_speakers", group: "Inicio", label: "Botón equipo", type: "text", description: "Texto del acceso rápido a equipo docente." },
  { key: "home.secondary_button_resources", group: "Inicio", label: "Botón recursos", type: "text", description: "Texto del acceso rápido a recursos." },
  { key: "home.metric_sessions_label", group: "Datos clave", label: "Etiqueta sesiones", type: "text", description: "Etiqueta del dato clave de sesiones." },
  { key: "home.metric_sessions_value", group: "Datos clave", label: "Valor sesiones", type: "text", description: "Valor del dato clave de sesiones." },
  { key: "home.metric_course_label", group: "Datos clave", label: "Etiqueta curso", type: "text", description: "Etiqueta del dato clave de curso." },
  { key: "home.metric_course_value", group: "Datos clave", label: "Valor curso", type: "text", description: "Valor del curso." },
  { key: "home.metric_format_label", group: "Datos clave", label: "Etiqueta formato", type: "text", description: "Etiqueta del formato." },
  { key: "home.metric_format_value", group: "Datos clave", label: "Valor formato", type: "text", description: "Resumen visible de la modalidad." },
  { key: "home.metric_duration_label", group: "Datos clave", label: "Etiqueta duración", type: "text", description: "Etiqueta de duración." },
  { key: "home.metric_duration_value", group: "Datos clave", label: "Valor duración", type: "text", description: "Duración visible en portada." },
  { key: "agenda.title", group: "Agenda", label: "Título", type: "text", description: "Título de la vista Agenda." },
  { key: "agenda.description", group: "Agenda", label: "Descripción", type: "textarea", description: "Descripción breve de la agenda." },
  { key: "sessions.title", group: "Sesiones", label: "Título", type: "text", description: "Título de la vista Sesiones." },
  { key: "sessions.description", group: "Sesiones", label: "Descripción", type: "textarea", description: "Descripción breve de sesiones." },
  { key: "speakers.title", group: "Equipo docente", label: "Título", type: "text", description: "Título de la vista Equipo docente." },
  { key: "speakers.description", group: "Equipo docente", label: "Descripción", type: "textarea", description: "Descripción breve de equipo y ponentes." },
  { key: "resources.title", group: "Recursos", label: "Título", type: "text", description: "Título de la vista Recursos." },
  { key: "resources.description", group: "Recursos", label: "Descripción", type: "textarea", description: "Descripción breve de recursos." },
  { key: "contact.title", group: "Contacto", label: "Título", type: "text", description: "Título de la vista Contacto." },
  { key: "contact.description", group: "Contacto", label: "Descripción", type: "textarea", description: "Descripción breve de contacto." },
  { key: "contact.coordination_label", group: "Contacto", label: "Etiqueta coordinación", type: "text", description: "Etiqueta del campo coordinación." },
  { key: "contact.coordination_value", group: "Contacto", label: "Coordinación", type: "textarea", description: "Texto de coordinación." },
  { key: "contact.email_label", group: "Contacto", label: "Etiqueta email", type: "text", description: "Etiqueta del campo email." },
  { key: "contact.email_value", group: "Contacto", label: "Email", type: "text", description: "Email de contacto." },
  { key: "contact.phone_label", group: "Contacto", label: "Etiqueta teléfono", type: "text", description: "Etiqueta del campo teléfono." },
  { key: "contact.phone_value", group: "Contacto", label: "Teléfono", type: "text", description: "Teléfono de contacto." },
  { key: "footer.text", group: "Footer", label: "Texto del footer", type: "textarea", description: "Texto visible en el pie de página." },
  { key: "footer.admin_label", group: "Footer", label: "Etiqueta Admin", type: "text", description: "Texto del enlace al panel administrativo." }
];

const WELCOME_DEFAULTS = {
  visible: true,
  title: "Bienvenida a las JAP",
  subtitle: "Jornadas Docentes de Atención Primaria 2026-2027",
  intro: "Las Jornadas Docentes de Atención Primaria (JAP) son un programa anual de sesiones clínicas rotatorias, aprobado por la Comisión de Docencia, orientado a reforzar la formación práctica, la actualización basada en la evidencia y la integración entre residentes, tutores y profesionales del área.",
  button_label: "Ver instrucciones y cronograma",
  sections: [
    {
      title: "Objetivo de las JAP",
      text: "Las JAP buscan crear un espacio docente estable, práctico y compartido, centrado en problemas frecuentes de Atención Primaria. El objetivo es revisar la evidencia útil, compartir criterios de manejo y generar materiales aplicables en consulta.",
      bullets: []
    },
    {
      title: "Enfoque de cada sesión",
      text: "Cada sesión debe partir de un caso clínico real o verosímil y responder preguntas clínicas concretas: qué hacer en consulta, cuándo tratar, cuándo revisar, cuándo derivar y qué errores conviene evitar.",
      bullets: []
    },
    {
      title: "Estructura recomendada",
      text: "",
      bullets: [
        "Caso clínico inicial.",
        "Planteamiento del problema en Atención Primaria.",
        "Revisión práctica de una guía clínica o evidencia relevante.",
        "Aplicación al manejo en consulta.",
        "Criterios de seguimiento, derivación o coordinación con otros niveles.",
        "Conclusiones prácticas.",
        "Material breve final."
      ]
    },
    {
      title: "Papel del residente ponente",
      text: "El residente preparará y presentará la sesión con un enfoque práctico, claro y aplicable. Se recomienda evitar revisiones teóricas extensas y priorizar decisiones clínicas, casos y mensajes útiles para la consulta.",
      bullets: []
    },
    {
      title: "Papel del tutor",
      text: "El tutor acompañará la preparación de la sesión, revisará el enfoque clínico, ayudará a seleccionar la evidencia principal y asegurará que el contenido sea adecuado para la práctica real en Atención Primaria.",
      bullets: []
    },
    {
      title: "Apoyo de R3/R4",
      text: "Los residentes de tercer y cuarto año podrán apoyar en la estructura docente, revisión de bibliografía, preparación del caso clínico, diseño de la presentación y elaboración del material final.",
      bullets: []
    },
    {
      title: "Material final esperado",
      text: "Cada sesión debería terminar con un recurso breve y reutilizable: algoritmo, tabla resumen, checklist, hoja de manejo o puntos clave para consulta.",
      bullets: []
    }
  ],
  schedule_title: "Cronograma general",
  schedule_text: "Las JAP se desarrollarán entre septiembre de 2026 y mayo de 2027. La propuesta inicial contempla sesiones preferentemente los viernes, con una cadencia aproximada de cada tres semanas. Aunque se proponen 12 temas, se dejan 13 fechas inicialmente disponibles para facilitar la organización, permitir ajustes por incidencias o reservar alguna fecha si fuera necesario.",
  dates_title: "Fechas inicialmente disponibles",
  dates: [
    { date: "2026-09-04", label: "Viernes 4 de septiembre de 2026.", status: "disponible" },
    { date: "2026-09-25", label: "Viernes 25 de septiembre de 2026.", status: "disponible" },
    { date: "2026-10-16", label: "Viernes 16 de octubre de 2026.", status: "disponible" },
    { date: "2026-11-06", label: "Viernes 6 de noviembre de 2026.", status: "disponible" },
    { date: "2026-11-27", label: "Viernes 27 de noviembre de 2026.", status: "disponible" },
    { date: "2026-12-18", label: "Viernes 18 de diciembre de 2026.", status: "disponible" },
    { date: "2027-01-08", label: "Viernes 8 de enero de 2027.", status: "disponible" },
    { date: "2027-01-29", label: "Viernes 29 de enero de 2027.", status: "disponible" },
    { date: "2027-02-19", label: "Viernes 19 de febrero de 2027.", status: "disponible" },
    { date: "2027-03-12", label: "Viernes 12 de marzo de 2027.", status: "disponible" },
    { date: "2027-04-02", label: "Viernes 2 de abril de 2027.", status: "disponible" },
    { date: "2027-04-23", label: "Viernes 23 de abril de 2027.", status: "disponible" },
    { date: "2027-05-14", label: "Viernes 14 de mayo de 2027.", status: "disponible" }
  ]
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const state = {
  supabase: null,
  user: null,
  profile: null,
  jornadas: [],
  sedes: [],
  sesiones: [],
  ponentes: [],
  sesionPonentes: [],
  recursos: [],
  siteSettings: [],
  assignments: [],
  signupDates: [],
  assignmentsAvailable: false,
  modes: {
    session: "create",
    speaker: "create",
    resource: "create"
  }
};

function message(text) {
  $("#admin-message").textContent = text || "";
}

function canEdit() {
  return ["admin", "editor"].includes(state.profile?.role);
}

function canAdmin() {
  return state.profile?.role === "admin";
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function linesToArray(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function emptyToNull(value) {
  return value === "" ? null : value;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function timeValue(value) {
  return value ? String(value).slice(0, 5) : "";
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nextOrder(items, field = "orden") {
  return Math.max(0, ...items.map((item) => Number(item[field]) || 0)) + 1;
}

function primaryJourneyId() {
  return state.jornadas[0]?.id || "";
}

function setMode(type, mode) {
  state.modes[type] = mode;
  const labels = {
    session: {
      title: mode === "create" ? "Crear nueva sesión" : "Editar sesión existente",
      submit: mode === "create" ? "Crear sesión" : "Guardar cambios"
    },
    speaker: {
      title: mode === "create" ? "Crear nueva persona" : "Editar persona existente",
      submit: mode === "create" ? "Crear persona" : "Guardar cambios"
    },
    resource: {
      title: mode === "create" ? "Crear nuevo recurso" : "Editar recurso existente",
      submit: mode === "create" ? "Crear recurso" : "Guardar cambios"
    }
  };

  $(`#${type}-form-title`).textContent = labels[type].title;
  $(`#${type}-submit`).textContent = labels[type].submit;
}

function resetSessionForm() {
  const form = $("#session-form");
  form.reset();
  form.elements.id.value = "";
  form.elements.jornada_id.value = primaryJourneyId();
  form.elements.orden.value = nextOrder(state.sesiones);
  form.elements.modalidad.value = DEFAULT_MODALITY;
  form.elements.teams_url.value = DEFAULT_TEAMS;
  form.elements.estado.value = "publicada";
  form.elements.is_active.checked = true;
  $("#session-assignment-warning").hidden = true;
  renderSessionSpeakerOptions();
  setMode("session", "create");
}

function resetSpeakerForm() {
  const form = $("#speaker-form");
  form.reset();
  form.elements.id.value = "";
  form.elements.rol_persona.value = "ponente";
  form.elements.is_active.checked = true;
  setMode("speaker", "create");
}

function resetResourceForm() {
  const form = $("#resource-form");
  form.reset();
  form.elements.id.value = "";
  form.elements.tipo.value = "enlace";
  form.elements.categoria.value = "Otros";
  form.elements.orden.value = nextOrder(state.recursos);
  form.elements.visible.checked = true;
  setMode("resource", "create");
}

function setJourneyOptions() {
  const select = $("#session-form select[name='jornada_id']");
  select.innerHTML = state.jornadas
    .map((journey) => `<option value="${escapeHtml(journey.id)}">${escapeHtml(journey.titulo || journey.curso || journey.id)}</option>`)
    .join("");
}

function setVenueOptions() {
  const select = $("#session-form select[name='sede_id']");
  const typeOrder = { pendiente: 0, online: 1, centro_salud: 2, hospital: 3 };
  const venues = state.sedes
    .filter((venue) => venue.is_active !== false)
    .sort((a, b) => {
      const orderA = Number(a.orden) || 999;
      const orderB = Number(b.orden) || 999;
      if (orderA !== orderB) return orderA - orderB;
      const typeA = typeOrder[a.tipo_sede] ?? 9;
      const typeB = typeOrder[b.tipo_sede] ?? 9;
      if (typeA !== typeB) return typeA - typeB;
      return String(a.nombre || "").localeCompare(String(b.nombre || ""));
    });
  select.innerHTML =
    '<option value="">Sin sede asociada</option>' +
    venues.map((venue) => `<option value="${escapeHtml(venue.id)}">${escapeHtml(venue.nombre)}</option>`).join("");
}

function setSessionOptions() {
  const select = $("#resource-form select[name='sesion_id']");
  select.innerHTML =
    '<option value="">Sin sesión asociada</option>' +
    state.sesiones.map((session) => `<option value="${escapeHtml(session.id)}">${escapeHtml(session.orden || "")} ${escapeHtml(session.titulo)}</option>`).join("");

  const assignmentSelect = $("#assignment-form select[name='session_id']");
  if (assignmentSelect) {
    assignmentSelect.innerHTML = state.sesiones
      .map((session) => `<option value="${escapeHtml(session.id)}">${escapeHtml(session.orden || "")} ${escapeHtml(session.titulo)}</option>`)
      .join("");
  }
}

function defaultSessionRole(speaker) {
  if (speaker.rol_persona === "apoyo") return "Apoyo docente";
  if (speaker.rol_persona === "organizador") return "Apoyo / coordinación";
  return "Ponente";
}

function renderSessionSpeakerOptions(sessionId = "") {
  const container = $("#session-speaker-list");
  const activeSpeakers = state.ponentes.filter((speaker) => speaker.is_active);
  if (!activeSpeakers.length) {
    container.innerHTML = '<p class="empty-note">No hay personas activas para asociar.</p>';
    return;
  }

  const existing = new Map(
    state.sesionPonentes
      .filter((relation) => relation.sesion_id === sessionId)
      .map((relation) => [relation.ponente_id, relation])
  );

  container.innerHTML = activeSpeakers
    .map((speaker, index) => {
      const relation = existing.get(speaker.id);
      return `
        <article class="session-speaker-item">
          <label class="session-speaker-main">
            <input type="checkbox" data-session-speaker="${escapeHtml(speaker.id)}" ${relation ? "checked" : ""}>
            <span>
              ${escapeHtml(speaker.nombre)}
              <small>${escapeHtml(PERSON_ROLE_LABELS[speaker.rol_persona] || "ponente")} · ${escapeHtml(speaker.especialidad || "Sin cargo")}</small>
            </span>
          </label>
          <div class="session-speaker-meta">
            <label>Rol en la sesión <input data-session-speaker-role="${escapeHtml(speaker.id)}" value="${escapeHtml(relation?.rol || defaultSessionRole(speaker))}"></label>
            <label>Orden <input data-session-speaker-order="${escapeHtml(speaker.id)}" type="number" min="1" value="${escapeHtml(relation?.orden || index + 1)}"></label>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSiteSettings() {
  const values = new Map(state.siteSettings.map((setting) => [setting.key, setting.value || ""]));
  const groups = SITE_SETTING_DEFINITIONS.reduce((acc, definition) => {
    if (!acc.has(definition.group)) acc.set(definition.group, []);
    acc.get(definition.group).push(definition);
    return acc;
  }, new Map());

  $("#site-content-fields").innerHTML = [...groups.entries()]
    .map(([group, definitions]) => `
      <section class="settings-group">
        <h3>${escapeHtml(group)}</h3>
        ${definitions
          .map((definition) => {
            const value = escapeHtml(values.get(definition.key) || "");
            const control =
              definition.type === "textarea"
                ? `<textarea name="${escapeHtml(definition.key)}" rows="3">${value}</textarea>`
                : `<input name="${escapeHtml(definition.key)}" value="${value}">`;
            return `
              <label>
                ${escapeHtml(definition.label)}
                ${control}
                <span class="setting-description">${escapeHtml(definition.description || "")}</span>
              </label>
            `;
          })
          .join("")}
      </section>
    `)
    .join("");
}

function resetAssignmentForm() {
  const form = $("#assignment-form");
  if (!form) return;
  form.reset();
  form.elements.id.value = "";
  $("#assignment-form-title").textContent = "Editar asignación";
}

function renderAssignments() {
  const list = $("#assignments-list");
  if (!list) return;
  if (!state.assignmentsAvailable) {
    list.innerHTML = '<p class="empty-note">La tabla de asignaciones todavía no está disponible. Aplica la migración antes de gestionar inscripciones.</p>';
    return;
  }
  if (!state.assignments.length) {
    list.innerHTML = '<p class="empty-note">No hay inscripciones recibidas.</p>';
    return;
  }

  list.innerHTML = state.assignments
    .map((assignment) => {
      const sessionTitle = assignment.sesiones?.titulo || "Sesión pendiente";
      return `
        <article class="admin-list-item">
          <h3>${escapeHtml(sessionTitle)}</h3>
          <p>${escapeHtml(assignment.final_date || "")} · ${escapeHtml(assignment.status)} · ${escapeHtml(assignment.full_name)} · ${escapeHtml(assignment.health_center || "")}</p>
          <p>${escapeHtml(assignment.email)} · ${escapeHtml(assignment.phone)} · ${escapeHtml(assignment.profile)}</p>
          <div class="admin-actions">
            <button class="button" type="button" data-edit-assignment="${escapeHtml(assignment.id)}">Editar</button>
            ${assignment.status !== "revisada" ? `<button class="button" type="button" data-review-assignment="${escapeHtml(assignment.id)}">Marcar revisada</button>` : ""}
            ${assignment.status !== "confirmada" ? `<button class="button" type="button" data-confirm-assignment="${escapeHtml(assignment.id)}">Confirmar</button>` : ""}
            ${assignment.status !== "anulada" ? `<button class="button danger" type="button" data-void-assignment="${escapeHtml(assignment.id)}">Anular/liberar</button>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function editAssignment(id) {
  const assignment = state.assignments.find((item) => item.id === id);
  if (!assignment) return;
  fillForm($("#assignment-form"), assignment);
  $("#assignment-form").elements.show_public_health_center.checked = Boolean(assignment.show_public_health_center);
  $("#assignment-form-title").textContent = `Editar: ${assignment.sesiones?.titulo || "asignación"}`;
  $("#assignment-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

function siteSettingValue(key, fallback = "") {
  const setting = state.siteSettings.find((item) => item.key === key);
  return setting?.value ?? fallback;
}

function parseSettingJson(key, fallback) {
  const value = siteSettingValue(key, "");
  if (!value) return structuredClone(fallback);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : structuredClone(fallback);
  } catch (error) {
    console.warn(`No se pudo leer ${key} como JSON`, error);
    return structuredClone(fallback);
  }
}

function renderWelcomeEditor() {
  const form = $("#welcome-form");
  if (!form) return;
  form.elements["welcome.visible"].checked = siteSettingValue("welcome.visible", String(WELCOME_DEFAULTS.visible)) !== "false";
  form.elements["welcome.title"].value = siteSettingValue("welcome.title", WELCOME_DEFAULTS.title);
  form.elements["welcome.subtitle"].value = siteSettingValue("welcome.subtitle", WELCOME_DEFAULTS.subtitle);
  form.elements["welcome.intro"].value = siteSettingValue("welcome.intro", WELCOME_DEFAULTS.intro);
  form.elements["welcome.button_label"].value = siteSettingValue("welcome.button_label", WELCOME_DEFAULTS.button_label);
  form.elements["welcome.schedule_title"].value = siteSettingValue("welcome.schedule_title", WELCOME_DEFAULTS.schedule_title);
  form.elements["welcome.schedule_text"].value = siteSettingValue("welcome.schedule_text", WELCOME_DEFAULTS.schedule_text);
  form.elements["welcome.dates_title"].value = siteSettingValue("welcome.dates_title", WELCOME_DEFAULTS.dates_title);
  renderWelcomeSectionsEditor(parseSettingJson("welcome.sections", WELCOME_DEFAULTS.sections));
  renderWelcomeDatesEditor(parseSettingJson("welcome.dates", WELCOME_DEFAULTS.dates));
}

function renderWelcomeSectionsEditor(sections) {
  const container = $("#welcome-sections-editor");
  container.innerHTML = sections
    .map(
      (section, index) => `
        <article class="welcome-editor-item" data-welcome-section-row>
          <div class="admin-form-head">
            <h3>Sección ${index + 1}</h3>
            <button class="button danger" type="button" data-remove-welcome-row>Quitar</button>
          </div>
          <label>Título <input data-welcome-section-title value="${escapeHtml(section.title || "")}"></label>
          <label>Texto <textarea data-welcome-section-text rows="4">${escapeHtml(section.text || "")}</textarea></label>
          <label>Bullets, uno por línea <textarea data-welcome-section-bullets rows="5">${escapeHtml((section.bullets || []).join("\n"))}</textarea></label>
        </article>
      `
    )
    .join("");
}

function renderWelcomeDatesEditor(dates) {
  const container = $("#welcome-dates-editor");
  container.innerHTML = dates
    .map(
      (item, index) => `
        <article class="welcome-editor-item" data-welcome-date-row>
          <div class="admin-form-head">
            <h3>Fecha ${index + 1}</h3>
            <button class="button danger" type="button" data-remove-welcome-row>Quitar</button>
          </div>
          <div class="form-row">
            <label>Fecha <input data-welcome-date value="${escapeHtml(item.date || "")}" type="date"></label>
            <label>Estado
              <select data-welcome-date-status>
                <option value="disponible" ${item.status === "disponible" ? "selected" : ""}>disponible</option>
                <option value="asignada" ${item.status === "asignada" ? "selected" : ""}>asignada</option>
                <option value="reserva" ${item.status === "reserva" ? "selected" : ""}>reserva</option>
              </select>
            </label>
          </div>
          <label>Etiqueta visible <input data-welcome-date-label value="${escapeHtml(item.label || "")}"></label>
        </article>
      `
    )
    .join("");
}

function collectWelcomeSections() {
  return $$("[data-welcome-section-row]")
    .map((row) => ({
      title: row.querySelector("[data-welcome-section-title]").value.trim(),
      text: row.querySelector("[data-welcome-section-text]").value.trim(),
      bullets: linesToArray(row.querySelector("[data-welcome-section-bullets]").value)
    }))
    .filter((section) => section.title || section.text || section.bullets.length);
}

function collectWelcomeDates() {
  return $$("[data-welcome-date-row]")
    .map((row) => ({
      date: row.querySelector("[data-welcome-date]").value,
      label: row.querySelector("[data-welcome-date-label]").value.trim(),
      status: row.querySelector("[data-welcome-date-status]").value
    }))
    .filter((item) => item.date || item.label);
}

function addWelcomeSection() {
  const sections = collectWelcomeSections();
  sections.push({ title: "", text: "", bullets: [] });
  renderWelcomeSectionsEditor(sections);
}

function addWelcomeDate() {
  const dates = collectWelcomeDates();
  dates.push({ date: "", label: "", status: "disponible" });
  renderWelcomeDatesEditor(dates);
}

async function loadProfile() {
  const { data, error } = await state.supabase.from("profiles").select("*").eq("id", state.user.id).maybeSingle();
  if (error) throw error;
  state.profile = data;
}

async function loadAdminData() {
  const [
    { data: jornadas, error: journeyError },
    { data: sedes, error: venueError },
    { data: sesiones, error: sessionError },
    { data: ponentes, error: speakerError },
    { data: sesionPonentes, error: sessionSpeakerError },
    { data: recursos, error: resourceError },
    { data: siteSettings, error: siteSettingsError }
  ] = await Promise.all([
    state.supabase.from("jornadas").select("*").order("created_at", { ascending: true }),
    state.supabase.from("sedes").select("*").order("nombre", { ascending: true }),
    state.supabase.from("sesiones").select("*, sedes(nombre)").order("orden", { ascending: true }),
    state.supabase.from("ponentes").select("*").order("nombre", { ascending: true }),
    state.supabase.from("sesion_ponentes").select("*").order("orden", { ascending: true }),
    state.supabase.from("recursos").select("*, sesiones(titulo)").order("orden", { ascending: true }),
    state.supabase.from("site_settings").select("*").order("group_name", { ascending: true }).order("key", { ascending: true })
  ]);

  const error = journeyError || venueError || sessionError || speakerError || sessionSpeakerError || resourceError;
  if (error) throw error;
  if (siteSettingsError) {
    message("La tabla site_settings no está disponible. Ejecuta supabase/migration-site-content.sql para editar textos globales.");
  }

  state.jornadas = jornadas || [];
  state.sedes = sedes || [];
  state.sesiones = sesiones || [];
  state.ponentes = ponentes || [];
  state.sesionPonentes = sesionPonentes || [];
  state.recursos = recursos || [];
  state.siteSettings = siteSettingsError ? [] : siteSettings || [];
  await loadAssignmentsData();
  setJourneyOptions();
  setVenueOptions();
  setSessionOptions();
  renderLists();
  renderSiteSettings();
  renderWelcomeEditor();
  renderAssignments();
  if (state.modes.session === "create") {
    resetSessionForm();
  } else {
    renderSessionSpeakerOptions($("#session-form").elements.id.value);
  }
  if (state.modes.speaker === "create") resetSpeakerForm();
  if (state.modes.resource === "create") resetResourceForm();
}

async function loadAssignmentsData() {
  try {
    const [{ data: assignments, error: assignmentsError }, { data: signupDates, error: signupDatesError }] = await Promise.all([
      state.supabase
        .from("session_assignments")
        .select("*, sesiones(id,titulo,slug,bloque,orden)")
        .order("created_at", { ascending: false }),
      state.supabase.from("signup_dates").select("*").order("sort_order", { ascending: true })
    ]);
    const error = assignmentsError || signupDatesError;
    if (error) throw error;
    state.assignments = assignments || [];
    state.signupDates = signupDates || [];
    state.assignmentsAvailable = true;
  } catch (error) {
    console.warn("Asignaciones no disponibles", error);
    state.assignments = [];
    state.signupDates = [];
    state.assignmentsAvailable = false;
  }
}

function renderLists() {
  const showInactiveSessions = $("#show-inactive-sessions").checked;
  const showInactiveSpeakers = $("#show-inactive-speakers").checked;
  const showHiddenResources = $("#show-hidden-resources").checked;

  const sessions = showInactiveSessions ? state.sesiones : state.sesiones.filter((session) => session.is_active);
  $("#sessions-list").innerHTML = sessions.length
    ? sessions
        .map((session) => `
          <article class="admin-list-item">
            <h3>${escapeHtml(session.titulo)}</h3>
            <p>${escapeHtml(session.bloque || "")} · ${escapeHtml(session.estado)} · ${session.is_active ? "activa" : "inactiva"} · ${escapeHtml(session.sedes?.nombre || "sede pendiente")}</p>
            <div class="admin-actions">
              <button class="button" type="button" data-edit-session="${escapeHtml(session.id)}">Editar</button>
              ${session.estado !== "archivada" ? `<button class="button" type="button" data-archive-session="${escapeHtml(session.id)}">Archivar</button>` : ""}
              ${
                session.is_active
                  ? `<button class="button danger" type="button" data-delete-session="${escapeHtml(session.id)}">Desactivar</button>`
                  : `<button class="button" type="button" data-restore-session="${escapeHtml(session.id)}">Restaurar</button>`
              }
              ${canAdmin() ? `<button class="button danger secondary-danger" type="button" data-permanent-delete-session="${escapeHtml(session.id)}">Eliminar definitivamente</button>` : ""}
            </div>
          </article>
        `)
        .join("")
    : '<p class="empty-note">No hay sesiones en este listado.</p>';

  const speakers = showInactiveSpeakers ? state.ponentes : state.ponentes.filter((speaker) => speaker.is_active);
  $("#speakers-list").innerHTML = speakers.length
    ? speakers
        .map((speaker) => `
          <article class="admin-list-item">
            <h3>${escapeHtml(speaker.nombre)}</h3>
            <p>${escapeHtml(PERSON_ROLE_LABELS[speaker.rol_persona] || "ponente")} · ${escapeHtml([speaker.especialidad, speaker.centro].filter(Boolean).join(" · ") || "Sin datos profesionales")} · ${speaker.is_active ? "activo" : "inactivo"}</p>
            <div class="admin-actions">
              <button class="button" type="button" data-edit-speaker="${escapeHtml(speaker.id)}">Editar</button>
              ${
                speaker.is_active
                  ? `<button class="button danger" type="button" data-delete-speaker="${escapeHtml(speaker.id)}">Borrar</button>`
                  : `<button class="button" type="button" data-restore-speaker="${escapeHtml(speaker.id)}">Restaurar</button>`
              }
            </div>
          </article>
        `)
        .join("")
    : '<p class="empty-note">No hay personas en este listado.</p>';

  const resources = showHiddenResources ? state.recursos : state.recursos.filter((resource) => resource.visible);
  $("#resources-list").innerHTML = resources.length
    ? resources
        .map((resource) => `
          <article class="admin-list-item">
            <h3>${escapeHtml(resource.titulo)}</h3>
            <p>${escapeHtml(resource.tipo)} · ${resource.visible ? "visible" : "oculto"} · ${escapeHtml(resource.categoria || "sin categoría")} · ${escapeHtml(resource.sesiones?.titulo || "sin sesión")}</p>
            <div class="admin-actions">
              <button class="button" type="button" data-edit-resource="${escapeHtml(resource.id)}">Editar</button>
              ${
                resource.visible
                  ? `<button class="button danger" type="button" data-delete-resource="${escapeHtml(resource.id)}">Borrar</button>`
                  : `<button class="button" type="button" data-restore-resource="${escapeHtml(resource.id)}">Restaurar</button>`
              }
            </div>
          </article>
        `)
        .join("")
    : '<p class="empty-note">No hay recursos en este listado.</p>';
}

function fillForm(form, data) {
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements[key];
    if (!field) return;
    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else if (Array.isArray(value)) {
      field.value = value.join("\n");
    } else if (field.type === "time") {
      field.value = timeValue(value);
    } else {
      field.value = value ?? "";
    }
  });
}

function editSession(id) {
  const session = state.sesiones.find((item) => item.id === id);
  if (!session) return;
  fillForm($("#session-form"), session);
  const activeAssignment = state.assignments.find((assignment) =>
    assignment.session_id === id && ["recibida", "revisada", "confirmada"].includes(assignment.status)
  );
  $("#session-assignment-warning").hidden = !activeAssignment;
  renderSessionSpeakerOptions(session.id);
  setMode("session", "edit");
  message(`Editando sesión: ${session.titulo}`);
  $("#session-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

function editSpeaker(id) {
  const speaker = state.ponentes.find((item) => item.id === id);
  if (!speaker) return;
  fillForm($("#speaker-form"), speaker);
  setMode("speaker", "edit");
  message(`Editando persona: ${speaker.nombre}`);
  $("#speaker-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

function editResource(id) {
  const resource = state.recursos.find((item) => item.id === id);
  if (!resource) return;
  fillForm($("#resource-form"), resource);
  setMode("resource", "edit");
  message(`Editando recurso: ${resource.titulo}`);
  $("#resource-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveSession(event) {
  event.preventDefault();
  if (!canEdit()) return;
  const form = event.currentTarget;
  const values = formData(form);
  const title = values.titulo.trim();
  const slug = values.slug.trim() || slugify(title);
  const payload = {
    jornada_id: emptyToNull(values.jornada_id) || primaryJourneyId() || null,
    sede_id: emptyToNull(values.sede_id),
    titulo: title,
    slug,
    bloque: emptyToNull(values.bloque),
    orden: values.orden ? Number(values.orden) : nextOrder(state.sesiones),
    objetivo: emptyToNull(values.objetivo),
    objetivos_docentes: emptyToNull(values.objetivos_docentes),
    descripcion: emptyToNull(values.descripcion),
    metodologia: emptyToNull(values.metodologia),
    contenidos_clave: linesToArray(values.contenidos_clave),
    bibliografia: emptyToNull(values.bibliografia),
    responsable_revision: emptyToNull(values.responsable_revision),
    fecha_revision: emptyToNull(values.fecha_revision),
    material_previo: emptyToNull(values.material_previo),
    material_posterior: emptyToNull(values.material_posterior),
    observaciones_internas: emptyToNull(values.observaciones_internas),
    fecha: emptyToNull(values.fecha),
    hora_inicio: emptyToNull(values.hora_inicio),
    hora_fin: emptyToNull(values.hora_fin),
    modalidad: emptyToNull(values.modalidad) || DEFAULT_MODALITY,
    teams_url: emptyToNull(values.teams_url) || DEFAULT_TEAMS,
    imagen_url: emptyToNull(values.imagen_url),
    estado: values.estado || "publicada",
    is_active: form.elements.is_active.checked
  };
  if (values.id) payload.id = values.id;

  const { data: savedSession, error } = await state.supabase.from("sesiones").upsert(payload).select().single();
  if (error) throw error;
  await saveSessionSpeakers(savedSession.id, form);
  await loadAdminData();
  message(state.modes.session === "create" ? "Sesión creada. Si está publicada y activa, aparecerá en la app pública." : "Cambios de sesión guardados.");
  resetSessionForm();
}

async function saveSessionSpeakers(sessionId, form) {
  const checked = Array.from(form.querySelectorAll("[data-session-speaker]:checked"));
  const rows = checked.map((input, index) => {
    const speakerId = input.dataset.sessionSpeaker;
    const role = Array.from(form.querySelectorAll("[data-session-speaker-role]")).find((field) => field.dataset.sessionSpeakerRole === speakerId)?.value.trim() || "Ponente";
    const orderValue = Array.from(form.querySelectorAll("[data-session-speaker-order]")).find((field) => field.dataset.sessionSpeakerOrder === speakerId)?.value;
    return {
      sesion_id: sessionId,
      ponente_id: speakerId,
      rol: role,
      orden: orderValue ? Number(orderValue) : index + 1
    };
  });

  const { error: deleteError } = await state.supabase.from("sesion_ponentes").delete().eq("sesion_id", sessionId);
  if (deleteError) throw deleteError;
  if (!rows.length) return;
  const { error: insertError } = await state.supabase.from("sesion_ponentes").insert(rows);
  if (insertError) throw insertError;
}

async function saveSpeaker(event) {
  event.preventDefault();
  if (!canEdit()) return;
  const form = event.currentTarget;
  const values = formData(form);
  const payload = {
    nombre: values.nombre.trim(),
    especialidad: emptyToNull(values.especialidad),
    centro: emptyToNull(values.centro),
    bio: emptyToNull(values.bio),
    foto_url: emptyToNull(values.foto_url),
    email_publico: emptyToNull(values.email_publico),
    rol_persona: values.rol_persona || "ponente",
    is_active: form.elements.is_active.checked
  };
  if (values.id) payload.id = values.id;

  const { error } = await state.supabase.from("ponentes").upsert(payload).select().single();
  if (error) throw error;
  await loadAdminData();
  message(state.modes.speaker === "create" ? "Persona creada." : "Cambios de persona guardados.");
  resetSpeakerForm();
}

async function saveResource(event) {
  event.preventDefault();
  if (!canEdit()) return;
  const form = event.currentTarget;
  const values = formData(form);
  const isProposal = values.url.includes("propuesta-jornadas-docentes-ap.pdf");
  const payload = {
    titulo: values.titulo.trim(),
    tipo: values.tipo,
    categoria: emptyToNull(values.categoria),
    url: values.url.trim(),
    sesion_id: emptyToNull(values.sesion_id),
    descripcion: emptyToNull(values.descripcion),
    orden: values.orden ? Number(values.orden) : nextOrder(state.recursos),
    visible: form.elements.visible.checked && !isProposal
  };
  if (values.id) payload.id = values.id;

  const { error } = await state.supabase.from("recursos").upsert(payload).select().single();
  if (error) throw error;
  await loadAdminData();
  message(isProposal ? "Recurso guardado oculto: el documento de propuesta no debe publicarse." : state.modes.resource === "create" ? "Recurso creado." : "Cambios de recurso guardados.");
  resetResourceForm();
}

async function saveSiteSettings(event) {
  event.preventDefault();
  if (!canEdit()) return;
  const values = formData(event.currentTarget);
  const payload = SITE_SETTING_DEFINITIONS.map((definition) => ({
    key: definition.key,
    value: values[definition.key] ?? "",
    type: definition.type,
    group_name: definition.group,
    label: definition.label,
    description: definition.description
  }));

  const { error } = await state.supabase.from("site_settings").upsert(payload, { onConflict: "key" });
  if (error) throw error;
  await loadAdminData();
  message("Textos de la app guardados.");
}

async function saveWelcomeSettings(event) {
  event.preventDefault();
  if (!canEdit()) return;
  const form = event.currentTarget;
  const values = formData(form);
  const payload = [
    {
      key: "welcome.visible",
      value: String(form.elements["welcome.visible"].checked),
      type: "boolean",
      group_name: "Bienvenida / instrucciones",
      label: "Visible",
      description: "Muestra u oculta el bloque de bienvenida en la home."
    },
    {
      key: "welcome.title",
      value: values["welcome.title"] || "",
      type: "text",
      group_name: "Bienvenida / instrucciones",
      label: "Título",
      description: "Título de la tarjeta y del modal."
    },
    {
      key: "welcome.subtitle",
      value: values["welcome.subtitle"] || "",
      type: "text",
      group_name: "Bienvenida / instrucciones",
      label: "Subtítulo",
      description: "Subtítulo opcional visible en tarjeta y modal."
    },
    {
      key: "welcome.intro",
      value: values["welcome.intro"] || "",
      type: "textarea",
      group_name: "Bienvenida / instrucciones",
      label: "Texto introductorio",
      description: "Resumen visible en la home y apertura del modal."
    },
    {
      key: "welcome.button_label",
      value: values["welcome.button_label"] || "",
      type: "text",
      group_name: "Bienvenida / instrucciones",
      label: "Texto del botón",
      description: "Etiqueta del botón que abre el modal."
    },
    {
      key: "welcome.sections",
      value: JSON.stringify(collectWelcomeSections()),
      type: "json",
      group_name: "Bienvenida / instrucciones",
      label: "Secciones de instrucciones",
      description: "Lista estructurada de secciones con título, texto y bullets."
    },
    {
      key: "welcome.schedule_title",
      value: values["welcome.schedule_title"] || "",
      type: "text",
      group_name: "Bienvenida / instrucciones",
      label: "Título cronograma",
      description: "Título del bloque de cronograma general."
    },
    {
      key: "welcome.schedule_text",
      value: values["welcome.schedule_text"] || "",
      type: "textarea",
      group_name: "Bienvenida / instrucciones",
      label: "Texto cronograma",
      description: "Descripción del cronograma general."
    },
    {
      key: "welcome.dates_title",
      value: values["welcome.dates_title"] || "",
      type: "text",
      group_name: "Bienvenida / instrucciones",
      label: "Título fechas",
      description: "Título del listado de fechas."
    },
    {
      key: "welcome.dates",
      value: JSON.stringify(collectWelcomeDates()),
      type: "json",
      group_name: "Bienvenida / instrucciones",
      label: "Fechas inicialmente disponibles",
      description: "Lista estructurada de fechas, etiqueta visible y estado."
    }
  ];

  const { error } = await state.supabase.from("site_settings").upsert(payload, { onConflict: "key" });
  if (error) throw error;
  await loadAdminData();
  message("Bienvenida e instrucciones guardadas.");
}

function assignmentConflictMessage(error) {
  if (error?.code === "23505") {
    return "No se puede guardar: la sesión o la fecha final ya están ocupadas por otra asignación activa.";
  }
  return error?.message || "No se pudo guardar la asignación.";
}

async function saveAssignment(event) {
  event.preventDefault();
  if (!canEdit() || !state.assignmentsAvailable) return;
  const form = event.currentTarget;
  const values = formData(form);
  if (!values.id) {
    message("Selecciona una asignación existente para editarla.");
    return;
  }

  const status = values.status || "recibida";
  const payload = {
    session_id: values.session_id,
    final_date: values.final_date,
    status,
    full_name: values.full_name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    profile: values.profile,
    health_center: values.health_center.trim(),
    tutor_name: emptyToNull(values.tutor_name),
    other_residents: emptyToNull(values.other_residents),
    comments: emptyToNull(values.comments),
    internal_notes: emptyToNull(values.internal_notes),
    public_health_center: emptyToNull(values.public_health_center),
    show_public_health_center: form.elements.show_public_health_center.checked
  };
  if (status === "revisada") payload.reviewed_at = new Date().toISOString();
  if (status === "confirmada") payload.confirmed_at = new Date().toISOString();
  if (status === "anulada") payload.cancelled_at = new Date().toISOString();

  const { error } = await state.supabase.from("session_assignments").update(payload).eq("id", values.id);
  if (error) throw error;
  await loadAdminData();
  message("Asignación guardada.");
}

async function updateAssignmentStatus(id, status) {
  if (!canEdit() || !state.assignmentsAvailable) return;
  const payload = { status };
  if (status === "revisada") payload.reviewed_at = new Date().toISOString();
  if (status === "confirmada") payload.confirmed_at = new Date().toISOString();
  if (status === "anulada") payload.cancelled_at = new Date().toISOString();
  const { error } = await state.supabase.from("session_assignments").update(payload).eq("id", id);
  if (error) throw error;
  await loadAdminData();
  message(status === "anulada" ? "Asignación anulada. La sesión y la fecha quedan liberadas." : `Asignación marcada como ${status}.`);
}

async function cancelCurrentAssignment() {
  const id = $("#assignment-form").elements.id.value;
  if (!id) {
    message("Selecciona una asignación para anularla.");
    return;
  }
  if (!confirm("¿Anular esta asignación y liberar sesión/fecha?")) return;
  await updateAssignmentStatus(id, "anulada");
}

async function exportBackup() {
  if (!canEdit()) {
    message("No tienes permisos para exportar la copia de seguridad.");
    return;
  }

  const [
    { data: jornadas, error: journeyError },
    { data: sesiones, error: sessionError },
    { data: ponentes, error: speakerError },
    { data: sesionPonentes, error: sessionSpeakerError },
    { data: recursos, error: resourceError },
    { data: sedes, error: venueError },
    { data: siteSettings, error: siteSettingsError }
  ] = await Promise.all([
    state.supabase.from("jornadas").select("*").order("created_at", { ascending: true }),
    state.supabase.from("sesiones").select("*").order("orden", { ascending: true }),
    state.supabase.from("ponentes").select("*").order("nombre", { ascending: true }),
    state.supabase.from("sesion_ponentes").select("*").order("orden", { ascending: true }),
    state.supabase.from("recursos").select("*").order("orden", { ascending: true }),
    state.supabase.from("sedes").select("*").order("nombre", { ascending: true }),
    state.supabase.from("site_settings").select("*").order("group_name", { ascending: true }).order("key", { ascending: true })
  ]);

  const error = journeyError || sessionError || speakerError || sessionSpeakerError || resourceError || venueError || siteSettingsError;
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  const backup = {
    generated_at: new Date().toISOString(),
    app: "JAP",
    version: "2.8",
    tables: {
      jornadas: jornadas || [],
      sesiones: sesiones || [],
      ponentes: ponentes || [],
      sesion_ponentes: sesionPonentes || [],
      recursos: recursos || [],
      sedes: sedes || [],
      site_settings: siteSettings || []
    }
  };

  downloadJson(`jap-backup-${today}.json`, backup);
  message("Copia de seguridad exportada.");
}

async function archiveSession(id) {
  const { error } = await state.supabase.from("sesiones").update({ estado: "archivada" }).eq("id", id);
  if (error) throw error;
  await loadAdminData();
  message("Sesión archivada. Ya no aparecerá públicamente.");
}

async function softDelete(table, id, payload, label) {
  if (!confirm(DELETE_MESSAGE)) return;
  const { error } = await state.supabase.from(table).update(payload).eq("id", id);
  if (error) throw error;
  await loadAdminData();
  message(`${label} borrado de forma lógica.`);
}

async function restore(table, id, payload, label) {
  const { error } = await state.supabase.from(table).update(payload).eq("id", id);
  if (error) throw error;
  await loadAdminData();
  message(`${label} restaurado.`);
}

async function permanentlyDeleteSession(id) {
  if (!canAdmin()) {
    message("Solo un usuario admin puede eliminar definitivamente una sesión.");
    return;
  }

  const session = state.sesiones.find((item) => item.id === id);
  if (!session) return;

  const speakerRelations = state.sesionPonentes.filter((relation) => relation.sesion_id === id).length;
  const linkedResources = state.recursos.filter((resource) => resource.sesion_id === id).length;
  if (speakerRelations || linkedResources) {
    message(`No se puede eliminar definitivamente: tiene ${speakerRelations} relación(es) con ponentes y ${linkedResources} recurso(s) asociado(s). Quita esas asociaciones primero.`);
    return;
  }

  const warning = `Vas a eliminar definitivamente "${session.titulo}". Esta acción no se puede deshacer salvo restaurando una copia de seguridad. Exporta un backup antes de continuar. Escribe ${PERMANENT_DELETE_WORD} para confirmar.`;
  const confirmation = prompt(warning);
  if (confirmation !== PERMANENT_DELETE_WORD) {
    message("Eliminación definitiva cancelada.");
    return;
  }

  const { error } = await state.supabase.from("sesiones").delete().eq("id", id);
  if (error) throw error;
  await loadAdminData();
  message("Sesión eliminada definitivamente.");
}

async function refreshSession() {
  const { data } = await state.supabase.auth.getSession();
  state.user = data.session?.user || null;

  $("#login-view").hidden = Boolean(state.user);
  $("#admin-view").hidden = !state.user;
  $("#admin-user").textContent = state.user ? state.user.email : "";

  if (!state.user) return;
  await loadProfile();
  if (!canEdit()) {
    $("#admin-view").innerHTML = '<section class="admin-card"><h1>Sin permisos de edición</h1><p>Tu usuario no tiene role admin o editor en profiles.</p></section>';
    return;
  }
  await loadAdminData();
}

function bindEvents() {
  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("#login-message").textContent = "";
    const values = formData(event.currentTarget);
    const { error } = await state.supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });
    if (error) {
      $("#login-message").textContent = error.message;
      return;
    }
    await refreshSession();
  });

  $("#logout-button").addEventListener("click", async () => {
    await state.supabase.auth.signOut();
    await refreshSession();
  });

  $$("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.adminTab;
      $$("[data-admin-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.adminPanel !== tab;
      });
      $$("[data-admin-tab]").forEach((tabButton) => tabButton.classList.toggle("primary", tabButton === button));
    });
  });

  $("[data-new-session]").addEventListener("click", resetSessionForm);
  $("[data-new-speaker]").addEventListener("click", resetSpeakerForm);
  $("[data-new-resource]").addEventListener("click", resetResourceForm);

  $("#session-form input[name='titulo']").addEventListener("input", (event) => {
    const form = $("#session-form");
    if (state.modes.session === "create" && !form.elements.slug.value) {
      form.elements.slug.value = slugify(event.target.value);
    }
  });

  $("#show-inactive-sessions").addEventListener("change", renderLists);
  $("#show-inactive-speakers").addEventListener("change", renderLists);
  $("#show-hidden-resources").addEventListener("change", renderLists);

  $("#session-form").addEventListener("submit", (event) => saveSession(event).catch((error) => message(error.message)));
  $("#speaker-form").addEventListener("submit", (event) => saveSpeaker(event).catch((error) => message(error.message)));
  $("#resource-form").addEventListener("submit", (event) => saveResource(event).catch((error) => message(error.message)));
  $("#site-content-form").addEventListener("submit", (event) => saveSiteSettings(event).catch((error) => message(error.message)));
  $("#welcome-form").addEventListener("submit", (event) => saveWelcomeSettings(event).catch((error) => message(error.message)));
  $("#assignment-form").addEventListener("submit", (event) => saveAssignment(event).catch((error) => message(assignmentConflictMessage(error))));
  $("[data-reset-assignment]").addEventListener("click", resetAssignmentForm);
  $("[data-cancel-assignment]").addEventListener("click", () => cancelCurrentAssignment().catch((error) => message(assignmentConflictMessage(error))));
  $("[data-reload-assignments]").addEventListener("click", () => loadAdminData().catch((error) => message(error.message)));
  $("[data-add-welcome-section]").addEventListener("click", addWelcomeSection);
  $("[data-add-welcome-date]").addEventListener("click", addWelcomeDate);
  $("#backup-export-button").addEventListener("click", () => exportBackup().catch((error) => message(error.message)));

  document.addEventListener("click", (event) => {
    const sessionId = event.target.closest("[data-edit-session]")?.dataset.editSession;
    const speakerId = event.target.closest("[data-edit-speaker]")?.dataset.editSpeaker;
    const resourceId = event.target.closest("[data-edit-resource]")?.dataset.editResource;
    const deleteSessionId = event.target.closest("[data-delete-session]")?.dataset.deleteSession;
    const archiveSessionId = event.target.closest("[data-archive-session]")?.dataset.archiveSession;
    const permanentDeleteSessionId = event.target.closest("[data-permanent-delete-session]")?.dataset.permanentDeleteSession;
    const deleteSpeakerId = event.target.closest("[data-delete-speaker]")?.dataset.deleteSpeaker;
    const deleteResourceId = event.target.closest("[data-delete-resource]")?.dataset.deleteResource;
    const restoreSessionId = event.target.closest("[data-restore-session]")?.dataset.restoreSession;
    const restoreSpeakerId = event.target.closest("[data-restore-speaker]")?.dataset.restoreSpeaker;
    const restoreResourceId = event.target.closest("[data-restore-resource]")?.dataset.restoreResource;
    const removableWelcomeRow = event.target.closest("[data-remove-welcome-row]")?.closest(".welcome-editor-item");
    const assignmentId = event.target.closest("[data-edit-assignment]")?.dataset.editAssignment;
    const reviewAssignmentId = event.target.closest("[data-review-assignment]")?.dataset.reviewAssignment;
    const confirmAssignmentId = event.target.closest("[data-confirm-assignment]")?.dataset.confirmAssignment;
    const voidAssignmentId = event.target.closest("[data-void-assignment]")?.dataset.voidAssignment;

    if (sessionId) editSession(sessionId);
    if (speakerId) editSpeaker(speakerId);
    if (resourceId) editResource(resourceId);
    if (archiveSessionId) archiveSession(archiveSessionId).catch((error) => message(error.message));
    if (deleteSessionId) softDelete("sesiones", deleteSessionId, { is_active: false }, "Sesión").catch((error) => message(error.message));
    if (permanentDeleteSessionId) permanentlyDeleteSession(permanentDeleteSessionId).catch((error) => message(error.message));
    if (deleteSpeakerId) softDelete("ponentes", deleteSpeakerId, { is_active: false }, "Persona").catch((error) => message(error.message));
    if (deleteResourceId) softDelete("recursos", deleteResourceId, { visible: false }, "Recurso").catch((error) => message(error.message));
    if (restoreSessionId) restore("sesiones", restoreSessionId, { is_active: true }, "Sesión").catch((error) => message(error.message));
    if (restoreSpeakerId) restore("ponentes", restoreSpeakerId, { is_active: true }, "Persona").catch((error) => message(error.message));
    if (restoreResourceId) restore("recursos", restoreResourceId, { visible: true }, "Recurso").catch((error) => message(error.message));
    if (removableWelcomeRow) removableWelcomeRow.remove();
    if (assignmentId) editAssignment(assignmentId);
    if (reviewAssignmentId) updateAssignmentStatus(reviewAssignmentId, "revisada").catch((error) => message(assignmentConflictMessage(error)));
    if (confirmAssignmentId) updateAssignmentStatus(confirmAssignmentId, "confirmada").catch((error) => message(assignmentConflictMessage(error)));
    if (voidAssignmentId) updateAssignmentStatus(voidAssignmentId, "anulada").catch((error) => message(assignmentConflictMessage(error)));
  });
}

async function init() {
  state.supabase = await getSupabaseClient();
  if (!state.supabase) {
    const config = await loadJapConfig();
    $("#config-warning").hidden = false;
    $("#login-view").hidden = true;
    if (config && !hasSupabaseConfig(config)) {
      $("#config-warning").innerHTML = `
        <h1>Config.js incompleto</h1>
        <p>Revisa que <code>config.js</code> defina <code>window.JAP_SUPABASE_CONFIG</code> con <code>SUPABASE_URL</code> y <code>SUPABASE_ANON_KEY</code>.</p>
      `;
    }
    return;
  }

  bindEvents();
  await refreshSession();
}

init().catch((error) => {
  $("#config-warning").hidden = false;
  $("#config-warning").innerHTML = `<h1>Error inicializando admin</h1><p>${escapeHtml(error.message)}</p>`;
});
