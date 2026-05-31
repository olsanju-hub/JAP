import { getSupabaseClient, hasSupabaseConfig, loadJapConfig } from "./supabase-client.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const DEFAULT_MODALITY = "Preferentemente presencial, con opción online por Teams";
const DEFAULT_TEAMS = "Enlace Teams pendiente de confirmar";
const DELETE_MESSAGE = "¿Seguro que quieres borrar este elemento? No se eliminará definitivamente, pero dejará de mostrarse públicamente.";

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
  recursos: [],
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
      title: mode === "create" ? "Crear nuevo ponente" : "Editar ponente existente",
      submit: mode === "create" ? "Crear ponente" : "Guardar cambios"
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
  setMode("session", "create");
}

function resetSpeakerForm() {
  const form = $("#speaker-form");
  form.reset();
  form.elements.id.value = "";
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
  select.innerHTML =
    '<option value="">Sede pendiente de confirmar</option>' +
    state.sedes.map((venue) => `<option value="${escapeHtml(venue.id)}">${escapeHtml(venue.nombre)}</option>`).join("");
}

function setSessionOptions() {
  const select = $("#resource-form select[name='sesion_id']");
  select.innerHTML =
    '<option value="">Sin sesión asociada</option>' +
    state.sesiones.map((session) => `<option value="${escapeHtml(session.id)}">${escapeHtml(session.orden || "")} ${escapeHtml(session.titulo)}</option>`).join("");
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
    { data: recursos, error: resourceError }
  ] = await Promise.all([
    state.supabase.from("jornadas").select("*").order("created_at", { ascending: true }),
    state.supabase.from("sedes").select("*").order("nombre", { ascending: true }),
    state.supabase.from("sesiones").select("*, sedes(nombre)").order("orden", { ascending: true }),
    state.supabase.from("ponentes").select("*").order("nombre", { ascending: true }),
    state.supabase.from("recursos").select("*, sesiones(titulo)").order("orden", { ascending: true })
  ]);

  const error = journeyError || venueError || sessionError || speakerError || resourceError;
  if (error) throw error;

  state.jornadas = jornadas || [];
  state.sedes = sedes || [];
  state.sesiones = sesiones || [];
  state.ponentes = ponentes || [];
  state.recursos = recursos || [];
  setJourneyOptions();
  setVenueOptions();
  setSessionOptions();
  renderLists();
  if (state.modes.session === "create") resetSessionForm();
  if (state.modes.speaker === "create") resetSpeakerForm();
  if (state.modes.resource === "create") resetResourceForm();
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
              ${
                session.is_active
                  ? `<button class="button danger" type="button" data-delete-session="${escapeHtml(session.id)}">Borrar</button>`
                  : `<button class="button" type="button" data-restore-session="${escapeHtml(session.id)}">Restaurar</button>`
              }
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
            <p>${escapeHtml([speaker.especialidad, speaker.centro].filter(Boolean).join(" · ") || "Sin datos profesionales")} · ${speaker.is_active ? "activo" : "inactivo"}</p>
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
    : '<p class="empty-note">No hay ponentes en este listado.</p>';

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
  setMode("session", "edit");
  message(`Editando sesión: ${session.titulo}`);
  $("#session-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

function editSpeaker(id) {
  const speaker = state.ponentes.find((item) => item.id === id);
  if (!speaker) return;
  fillForm($("#speaker-form"), speaker);
  setMode("speaker", "edit");
  message(`Editando ponente: ${speaker.nombre}`);
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
    descripcion: emptyToNull(values.descripcion),
    contenidos_clave: linesToArray(values.contenidos_clave),
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

  const { error } = await state.supabase.from("sesiones").upsert(payload).select().single();
  if (error) throw error;
  await loadAdminData();
  message(state.modes.session === "create" ? "Sesión creada. Si está publicada y activa, aparecerá en la app pública." : "Cambios de sesión guardados.");
  resetSessionForm();
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
    is_active: form.elements.is_active.checked
  };
  if (values.id) payload.id = values.id;

  const { error } = await state.supabase.from("ponentes").upsert(payload).select().single();
  if (error) throw error;
  await loadAdminData();
  message(state.modes.speaker === "create" ? "Ponente creado." : "Cambios de ponente guardados.");
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

  document.addEventListener("click", (event) => {
    const sessionId = event.target.closest("[data-edit-session]")?.dataset.editSession;
    const speakerId = event.target.closest("[data-edit-speaker]")?.dataset.editSpeaker;
    const resourceId = event.target.closest("[data-edit-resource]")?.dataset.editResource;
    const deleteSessionId = event.target.closest("[data-delete-session]")?.dataset.deleteSession;
    const deleteSpeakerId = event.target.closest("[data-delete-speaker]")?.dataset.deleteSpeaker;
    const deleteResourceId = event.target.closest("[data-delete-resource]")?.dataset.deleteResource;
    const restoreSessionId = event.target.closest("[data-restore-session]")?.dataset.restoreSession;
    const restoreSpeakerId = event.target.closest("[data-restore-speaker]")?.dataset.restoreSpeaker;
    const restoreResourceId = event.target.closest("[data-restore-resource]")?.dataset.restoreResource;

    if (sessionId) editSession(sessionId);
    if (speakerId) editSpeaker(speakerId);
    if (resourceId) editResource(resourceId);
    if (deleteSessionId) softDelete("sesiones", deleteSessionId, { is_active: false, estado: "borrador" }, "Sesión").catch((error) => message(error.message));
    if (deleteSpeakerId) softDelete("ponentes", deleteSpeakerId, { is_active: false }, "Ponente").catch((error) => message(error.message));
    if (deleteResourceId) softDelete("recursos", deleteResourceId, { visible: false }, "Recurso").catch((error) => message(error.message));
    if (restoreSessionId) restore("sesiones", restoreSessionId, { is_active: true, estado: "publicada" }, "Sesión").catch((error) => message(error.message));
    if (restoreSpeakerId) restore("ponentes", restoreSpeakerId, { is_active: true }, "Ponente").catch((error) => message(error.message));
    if (restoreResourceId) restore("recursos", restoreResourceId, { visible: true }, "Recurso").catch((error) => message(error.message));
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
