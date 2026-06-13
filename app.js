import { getSupabaseClient } from "./supabase-client.js";

const state = {
  data: null,
  activeView: "inicio",
  dataSource: "json"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const VIEW_IDS = ["inicio", "agenda", "sesiones", "ponentes", "recursos", "contacto"];
const PERSON_ROLE_LABELS = {
  organizador: "Organización y coordinación",
  ponente: "Ponentes",
  apoyo: "Apoyo docente"
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const isPending = (value) => String(value).toLowerCase().includes("pendiente");

const allPending = (...values) => values.every(isPending);

const shortText = (value, max = 130) => {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
};

const pending = (value) => value || "Pendiente de confirmar";
const PUBLIC_SESSION_STATES = ["publicada", "realizada"];

function sessionStateLabel(stateValue) {
  const labels = {
    borrador: "Borrador",
    publicada: "Publicada",
    realizada: "Realizada",
    archivada: "Archivada"
  };
  return labels[stateValue] || "Pendiente de confirmar";
}

function isVisibleSession(session) {
  return session.is_active !== false && PUBLIC_SESSION_STATES.includes(session.estado);
}

function compareSessions(a, b) {
  const aHasDate = a.fecha && !isPending(a.fecha);
  const bHasDate = b.fecha && !isPending(b.fecha);
  if (aHasDate && bHasDate && a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
  if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;
  return (Number(a.orden || a.id) || 0) - (Number(b.orden || b.id) || 0);
}

function hasPublicText(value) {
  return Boolean(String(value || "").trim()) && !isPending(value);
}

function linkifyText(value) {
  const text = String(value || "");
  const urlPattern = /(https?:\/\/[^\s<>"']+)/g;
  return text
    .split(urlPattern)
    .map((part) => {
      if (/^https?:\/\//i.test(part)) {
        const safeUrl = escapeHtml(part);
        return `<a href="${safeUrl}" rel="noopener noreferrer">${safeUrl}</a>`;
      }
      return escapeHtml(part);
    })
    .join("");
}

function renderTextSection(title, value) {
  if (!hasPublicText(value)) return "";
  return `
    <section class="detail-section">
      <h3>${escapeHtml(title)}</h3>
      <div class="text-block">${linkifyText(value)}</div>
    </section>
  `;
}

function renderRevisionInfo(session) {
  const parts = [];
  if (hasPublicText(session.responsable_revision)) parts.push(`Responsable: ${session.responsable_revision}`);
  if (hasPublicText(session.fecha_revision)) parts.push(`Fecha: ${session.fecha_revision}`);
  return parts.length ? renderTextSection("Revisión docente", parts.join("\n")) : "";
}

function formatDate(value) {
  return value || "Pendiente de confirmar";
}

function formatTime(value) {
  return value ? value.slice(0, 5) : "Pendiente de confirmar";
}

function resourceFormat(resource) {
  if (resource.formato) return resource.formato;
  return (resource.tipo || "otro").toUpperCase();
}

function resourceType(resource) {
  if (resource.tipo === "pdf") return "documento";
  if (resource.tipo === "pptx") return "presentacion";
  if (resource.tipo === "imagen") return "imagen";
  if (resource.tipo === "cartel") return "cartel";
  if (resource.tipo === "enlace") return "enlace";
  return resource.tipo || "otro";
}

function resourceFile(resource) {
  return resource.archivo || resource.url || "";
}

function isPublicResource(resource) {
  const file = resourceFile(resource);
  return file && !file.includes("propuesta-jornadas-docentes-ap.pdf");
}

function resourceCategory(resource) {
  return String(resource.categoria || "").toLowerCase();
}

function flattenSiteContent(content = {}) {
  const flat = {};
  function visit(prefix, value) {
    Object.entries(value || {}).forEach(([key, item]) => {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      if (item && typeof item === "object" && !Array.isArray(item)) {
        visit(nextKey, item);
      } else {
        flat[nextKey] = item;
      }
    });
  }
  visit("", content);
  return flat;
}

function settingRowsToContent(rows = [], fallback = {}) {
  return rows.reduce(
    (content, row) => {
      if (row.key && row.value !== null && row.value !== undefined) content[row.key] = row.value;
      return content;
    },
    { ...fallback }
  );
}

function siteText(key, fallback = "Pendiente de confirmar") {
  const value = state.data?.siteContent?.[key];
  return value === null || value === undefined || value === "" ? fallback : value;
}

function siteBoolean(key, fallback = true) {
  const value = state.data?.siteContent?.[key];
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return !["false", "0", "no", "oculto"].includes(String(value).trim().toLowerCase());
}

function siteJson(key, fallback = []) {
  const value = state.data?.siteContent?.[key];
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed || fallback;
  } catch (error) {
    console.warn(`No se pudo interpretar ${key} como JSON`, error);
    return fallback;
  }
}

function renderSiteContent() {
  const setText = (selector, key, fallback) => {
    const element = $(selector);
    if (element) element.textContent = siteText(key, fallback);
  };

  setText("#home-title", "home.title", "Jornadas Docentes de Atención Primaria");
  setText("#home-subtitle", "home.subtitle", "Programa anual de sesiones clínicas para profesionales de Atención Primaria");
  setText("#program-description", "home.description", state.data?.programa?.descripcion || "Pendiente de confirmar");
  setText("#home-primary-button", "home.primary_button", "Ver agenda");
  setText("#home-sessions-button", "home.secondary_button_sessions", "Sesiones");
  setText("#home-speakers-button", "home.secondary_button_speakers", "Equipo docente");
  setText("#home-resources-button", "home.secondary_button_resources", "Recursos");
  setText("#metric-sessions-label", "home.metric_sessions_label", "Sesiones");
  setText("#metric-sessions-value", "home.metric_sessions_value", "12");
  setText("#metric-course-label", "home.metric_course_label", "Curso");
  setText("#metric-course-value", "home.metric_course_value", "2026-2027");
  setText("#metric-format-label", "home.metric_format_label", "Formato");
  setText("#program-modality-short", "home.metric_format_value", "Presencial preferente + Teams");
  setText("#metric-duration-label", "home.metric_duration_label", "Duración");
  setText("#program-duration-short", "home.metric_duration_value", "45-60 min");
  setText("#agenda-title", "agenda.title", "Agenda");
  setText("#agenda-description", "agenda.description", "Vista rápida del programa. Cada sesión abre su detalle completo en una ventana emergente.");
  setText("#sessions-title", "sessions.title", "Sesiones");
  setText("#sessions-description", "sessions.description", "Contenido docente organizado por temas clínicos frecuentes en Atención Primaria.");
  setText("#speakers-title", "speakers.title", "Equipo docente");
  setText("#speakers-description", "speakers.description", "Organización, coordinación y ponentes asociados a las sesiones.");
  setText("#resources-title", "resources.title", "Recursos");
  setText("#resources-description", "resources.description", "Material organizado por categorías compactas. Cada recurso se abre dentro de la app.");
  setText("#contact-title", "contact.title", "Contacto");
  setText("#contact-description", "contact.description", "Datos de coordinación del programa.");
  setText("#footer-text", "footer.text", "Jornadas Docentes de Atención Primaria · Programa anual 2026-2027.");
  setText("#footer-admin-link", "footer.admin_label", "Admin");
}

function welcomeData() {
  return {
    visible: siteBoolean("welcome.visible", true),
    title: siteText("welcome.title", "Bienvenida a las JAP"),
    subtitle: siteText("welcome.subtitle", "Jornadas Docentes de Atención Primaria 2026-2027"),
    intro: siteText("welcome.intro", ""),
    buttonLabel: siteText("welcome.button_label", "Ver instrucciones y cronograma"),
    sections: siteJson("welcome.sections", []),
    scheduleTitle: siteText("welcome.schedule_title", "Cronograma general"),
    scheduleText: siteText("welcome.schedule_text", ""),
    datesTitle: siteText("welcome.dates_title", "Fechas inicialmente disponibles"),
    dates: siteJson("welcome.dates", [])
  };
}

function renderWelcome() {
  const card = $("#welcome-card");
  if (!card) return;
  const data = welcomeData();
  card.hidden = !data.visible;
  if (!data.visible) return;

  $("#welcome-title").textContent = data.title;
  $("#welcome-subtitle").textContent = data.subtitle;
  $("#welcome-subtitle").hidden = !data.subtitle;
  $("#welcome-intro").textContent = data.intro;
  $("#welcome-button").textContent = data.buttonLabel;
}

function renderWelcomeSection(section) {
  const bullets = Array.isArray(section.bullets) ? section.bullets.filter(Boolean) : [];
  const text = String(section.text || "").trim();
  return `
    <article class="instruction-card">
      <h3>${escapeHtml(section.title || "")}</h3>
      ${text ? `<p>${escapeHtml(text)}</p>` : ""}
      ${
        bullets.length
          ? `<ul class="key-list">${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : ""
      }
    </article>
  `;
}

function formatWelcomeDate(item) {
  const label = item.label || item.date || "";
  const status = item.status || "disponible";
  const statusLabels = {
    disponible: "Disponible",
    asignada: "Asignada",
    reserva: "Reserva"
  };
  return `
    <li class="date-item">
      <span>${escapeHtml(label)}</span>
      <strong class="date-status ${escapeHtml(status)}">${escapeHtml(statusLabels[status] || status)}</strong>
    </li>
  `;
}

function showWelcome() {
  const data = welcomeData();
  $("#welcome-dialog-title").textContent = data.title;
  $("#welcome-dialog-subtitle").textContent = data.subtitle;
  $("#welcome-dialog-subtitle").hidden = !data.subtitle;
  $("#welcome-dialog-content").innerHTML = `
    ${data.intro ? `<section class="welcome-intro-panel"><p>${escapeHtml(data.intro)}</p></section>` : ""}
    <section class="instruction-grid">
      ${data.sections.map(renderWelcomeSection).join("")}
    </section>
    <section class="schedule-card">
      <h3>${escapeHtml(data.scheduleTitle)}</h3>
      <p>${escapeHtml(data.scheduleText)}</p>
    </section>
    <section class="dates-card">
      <h3>${escapeHtml(data.datesTitle)}</h3>
      <ul class="date-grid">
        ${data.dates.map(formatWelcomeDate).join("")}
      </ul>
    </section>
  `;

  const dialog = $("#welcome-dialog");
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeWelcomeDialog() {
  const dialog = $("#welcome-dialog");
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

function renderProgram(programa) {
  if (!state.data?.siteContent) {
    $("#program-description").textContent = programa.descripcion;
    $("#program-modality-short").textContent = programa.modalidad_resumen || programa.modalidad;
    $("#program-duration-short").textContent = programa.duracion.replace("utos por sesión", "");
  }
}

function renderAgenda(sesiones) {
  const agendaSessions = sesiones.filter((session) => session.estado === "publicada").sort(compareSessions);
  $("#agenda-list").innerHTML = agendaSessions.length
    ? agendaSessions
    .map(
      (session) => `
        <article class="timeline-item">
          <div class="timeline-number">${session.id}</div>
          <div>
            <p class="eyebrow">${escapeHtml(session.bloque)}</p>
            <h3>${escapeHtml(session.titulo)}</h3>
            <p class="compact-meta">${getAgendaMeta(session)}</p>
            <button class="button" type="button" data-session="${escapeHtml(session.slug)}">Ver detalle</button>
          </div>
        </article>
      `
    )
    .join("")
    : '<p class="empty-note">No hay sesiones publicadas en agenda.</p>';
}

function getAgendaMeta(session) {
  if (allPending(session.fecha, session.hora_inicio, session.hora_fin, session.sede, session.ponentes[0])) {
    return "Fecha, horario, sede y ponente pendientes de confirmar.";
  }

  const parts = [];
  if (!isPending(session.fecha)) parts.push(session.fecha);
  if (!isPending(session.hora_inicio) || !isPending(session.hora_fin)) parts.push(`${session.hora_inicio} - ${session.hora_fin}`);
  if (!isPending(session.sede)) parts.push(session.sede);
  parts.push(session.estado);
  return parts.join(" · ");
}

function renderSessions(sesiones) {
  const groups = [
    { title: "Próximas / publicadas", items: sesiones.filter((session) => session.estado === "publicada").sort(compareSessions) },
    { title: "Realizadas", items: sesiones.filter((session) => session.estado === "realizada").sort(compareSessions) }
  ];

  $("#session-grid").innerHTML = groups
    .filter((group) => group.items.length)
    .map(
      (group) => `
        <section class="session-group">
          <h3>${escapeHtml(group.title)}</h3>
          <div class="session-group-grid">
            ${group.items.map(renderSessionCard).join("")}
          </div>
        </section>
      `
    )
    .join("");

  if (!$("#session-grid").innerHTML) {
    $("#session-grid").innerHTML = '<p class="empty-note">No hay sesiones publicadas o realizadas.</p>';
  }
}

function renderSessionCard(session) {
  return `
    <article class="session-card">
      <div class="session-body">
        <p class="eyebrow">${escapeHtml(session.bloque)}</p>
        <h3>${escapeHtml(session.titulo)}</h3>
        <span class="tag ${session.estado === "realizada" ? "done" : ""}">${escapeHtml(sessionStateLabel(session.estado))}</span>
        <p>${escapeHtml(shortText(session.objetivo, 115))}</p>
        <ul class="key-list">
          ${session.contenidos_clave.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <div class="card-actions">
          <button class="button primary" type="button" data-session="${escapeHtml(session.slug)}">Ver detalle</button>
          ${session.imagen ? `<button class="button" type="button" data-session-poster="${escapeHtml(session.slug)}">Ver cartel</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderSpeakers(ponentes) {
  const groups = [
    { role: "organizador", title: "Organización y coordinación", empty: "" },
    { role: "ponente", title: "Ponentes", empty: "Los ponentes de cada sesión se incorporarán cuando estén confirmados." },
    { role: "apoyo", title: "Apoyo docente", empty: "" }
  ];

  $("#speaker-grid").innerHTML = groups
    .map((group) => {
      const items = ponentes.filter((speaker) =>
        group.role === "ponente" ? speaker.rol_persona === "ponente" || speaker.es_ponente_sesion : speaker.rol_persona === group.role
      );
      if (!items.length && !group.empty) return "";
      return `
        <section class="speaker-group">
          <h3>${escapeHtml(group.title)}</h3>
          <div class="speaker-group-grid">
            ${
              items.length
                ? items.map(renderSpeakerCard).join("")
                : `<article class="speaker-card"><h4>Pendiente de confirmar</h4><p>${escapeHtml(group.empty)}</p></article>`
            }
          </div>
        </section>
      `;
    })
    .join("");
}

function renderSpeakerCard(speaker) {
  return `
    <article class="speaker-card">
      ${speaker.foto_url ? `<img src="${escapeHtml(speaker.foto_url)}" alt="Foto de ${escapeHtml(speaker.nombre)}">` : ""}
      <h4>${escapeHtml(speaker.nombre)}</h4>
      <p><strong>${escapeHtml(speaker.especialidad || speaker.rol || "Pendiente de confirmar")}</strong></p>
      ${speaker.centro ? `<p>${escapeHtml(speaker.centro)}</p>` : ""}
      ${speaker.bio && !isPending(speaker.bio) ? `<p>${escapeHtml(speaker.bio)}</p>` : ""}
    </article>
  `;
}

function renderSessionSpeakers(speakers) {
  if (!speakers?.length) return "";
  return `
    <h3>Ponentes</h3>
    <div class="session-speaker-detail">
      ${speakers
        .map(
          (speaker) => `
            <article class="speaker-card">
              ${speaker.foto_url ? `<img src="${escapeHtml(speaker.foto_url)}" alt="Foto de ${escapeHtml(speaker.nombre)}">` : ""}
              <h4>${escapeHtml(speaker.nombre)}</h4>
              <p><strong>${escapeHtml(speaker.rol_sesion || "Ponente")}</strong></p>
              <p>${escapeHtml([speaker.especialidad, speaker.centro].filter(Boolean).join(" · ") || "Pendiente de confirmar")}</p>
              ${speaker.bio && !isPending(speaker.bio) ? `<p>${escapeHtml(speaker.bio)}</p>` : ""}
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderResources(recursos) {
  const publicResources = recursos.filter(isPublicResource);
  const groups = [
    { id: "programa", title: "Programa", filter: (resource) => resourceCategory(resource).includes("programa") || String(resource.id).includes("programa") },
    { id: "plantilla", title: "Plantilla", filter: (resource) => resourceType(resource) === "presentacion" },
    { id: "carteles", title: "Carteles de sesiones", filter: (resource) => resourceType(resource) === "cartel" },
    { id: "imagenes", title: "Imágenes promocionales", filter: (resource) => resourceType(resource) === "imagen" },
    {
      id: "otros",
      title: "Otros",
      filter: (resource) =>
        !["presentacion", "cartel", "imagen"].includes(resourceType(resource)) &&
        !resourceCategory(resource).includes("programa") &&
        !String(resource.id).includes("programa")
    }
  ];

  $("#resource-list").innerHTML = groups
    .map((group, index) => {
      const items = publicResources.filter(group.filter);
      return `
        <details class="resource-group" ${index < 2 ? "open" : ""}>
          <summary>
            <span>${escapeHtml(group.title)}</span>
            <strong>${items.length}</strong>
          </summary>
          <div class="resource-group-list">
            ${items.length ? items.map(renderResourceItem).join("") : '<p class="empty-note">Sin recursos disponibles por ahora.</p>'}
          </div>
        </details>
      `;
    })
    .join("");
}

function renderResourceItem(resource) {
  const file = resourceFile(resource);
  const isExternal = /^https?:\/\//i.test(file);
  const secondaryAction = isExternal
    ? `<a class="button" href="${escapeHtml(file)}">Abrir enlace</a>`
    : `<a class="button" href="${escapeHtml(file)}" download>Descargar</a>`;

  return `
    <article class="resource-card">
      <div>
        <p class="eyebrow">${escapeHtml(resourceType(resource))} · ${escapeHtml(resourceFormat(resource))}</p>
        <h3>${escapeHtml(resource.titulo)}</h3>
      </div>
      <div class="resource-actions">
        <button class="button primary" type="button" data-resource="${escapeHtml(resource.id)}">Ver recurso</button>
        ${secondaryAction}
      </div>
    </article>
  `;
}

function renderContact(contacto) {
  const coordination = siteText("contact.coordination_value", contacto.coordinacion);
  const email = siteText("contact.email_value", contacto.email);
  const phone = siteText("contact.phone_value", contacto.telefono);
  $("#contact-card").innerHTML = `
    <p><strong>${escapeHtml(siteText("contact.coordination_label", "Coordinación"))}</strong><br>${escapeHtml(coordination)}</p>
    <p><strong>${escapeHtml(siteText("contact.email_label", "Email"))}</strong><br>${escapeHtml(email)}</p>
    <p><strong>${escapeHtml(siteText("contact.phone_label", "Teléfono"))}</strong><br>${escapeHtml(phone)}</p>
  `;
}

function showSession(slug) {
  const session = state.data.sesiones.find((item) => item.slug === slug);
  if (!session) return;
  const programa = state.data.programa;

  $("#dialog-block").textContent = session.bloque;
  $("#dialog-title").textContent = session.titulo;
  $("#dialog-content").innerHTML = `
    <div>
      <h3>Objetivo</h3>
      <p>${escapeHtml(session.objetivo)}</p>
      <h3>Descripción</h3>
      <p>${escapeHtml(session.descripcion)}</p>
      ${renderTextSection("Objetivos docentes", session.objetivos_docentes)}
      ${renderTextSection("Metodología", session.metodologia)}
      <h3>Contenidos clave</h3>
      <ul class="key-list">
        ${session.contenidos_clave.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>
    <div>
      <div class="detail-grid">
        <div class="detail-box"><strong>Modalidad</strong>${escapeHtml(programa.modalidad)}</div>
        <div class="detail-box"><strong>Teams</strong>${escapeHtml(programa.enlace_teams)}</div>
        <div class="detail-box"><strong>Fecha</strong>${escapeHtml(session.fecha)}</div>
        <div class="detail-box"><strong>Horario</strong>${escapeHtml(session.hora_inicio)} - ${escapeHtml(session.hora_fin)}</div>
        <div class="detail-box"><strong>Sede</strong>${escapeHtml(session.sede)}</div>
        <div class="detail-box"><strong>Estado</strong><span class="tag ${session.estado === "realizada" ? "done" : ""}">${escapeHtml(sessionStateLabel(session.estado))}</span></div>
      </div>
      ${renderSessionSpeakers(session.ponentes_detalle)}
      ${renderTextSection("Material previo", session.material_previo)}
      ${renderTextSection("Material posterior", session.material_posterior)}
      ${renderTextSection("Bibliografía", session.bibliografia)}
      ${renderRevisionInfo(session)}
      <h3>Recursos asociados</h3>
      <p>${session.recursos.length ? session.recursos.map(escapeHtml).join(", ") : "Pendiente de confirmar"}</p>
      <div class="dialog-actions inline-actions">
        ${session.imagen ? `<button class="button primary" type="button" data-session-poster="${escapeHtml(session.slug)}">Ver cartel</button>` : ""}
        <button class="button" type="button" data-close-session>Cerrar</button>
      </div>
    </div>
  `;

  const dialog = $("#session-dialog");
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeSessionDialog() {
  const dialog = $("#session-dialog");
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

function getResourcePreview(resource) {
  const file = escapeHtml(resourceFile(resource));
  const title = escapeHtml(resource.titulo);
  const type = resourceType(resource).toLowerCase();
  const format = resourceFormat(resource).toLowerCase();

  if (type === "imagen" || type === "cartel" || ["png", "jpg", "jpeg", "webp", "gif"].includes(format)) {
    return `
      <figure class="resource-preview image-preview">
        <img src="${file}" alt="${title}">
      </figure>
    `;
  }

  if (format === "pdf") {
    return `
      <div class="resource-preview pdf-preview">
        <iframe src="${file}" title="Previsualización de ${title}"></iframe>
        <p>Si el navegador no muestra el PDF correctamente, usa el botón de descarga.</p>
      </div>
    `;
  }

  return `
    <div class="resource-preview resource-fallback">
      <strong>${title}</strong>
      <p>${escapeHtml(resourceType(resource))} · ${escapeHtml(resourceFormat(resource))}</p>
      <p>Este tipo de archivo no se previsualiza de forma fiable dentro del navegador. Puedes descargarlo desde esta ficha.</p>
    </div>
  `;
}

function getSessionPosterResource(slug) {
  const session = state.data.sesiones.find((item) => item.slug === slug);
  if (!session?.imagen) return null;
  return {
    id: `cartel-${session.slug}`,
    titulo: `Cartel: ${session.titulo}`,
    tipo: "cartel",
    formato: "PNG",
    archivo: session.imagen
  };
}

function openResource(resource) {
  if (!resource) return;

  const rawFile = resourceFile(resource);
  const isExternal = /^https?:\/\//i.test(rawFile);
  const file = escapeHtml(rawFile);
  $("#resource-dialog-type").textContent = `${resourceType(resource)} · ${resourceFormat(resource)}`;
  $("#resource-dialog-title").textContent = resource.titulo;
  $("#resource-dialog-content").innerHTML = getResourcePreview(resource);
  $("#resource-dialog-actions").innerHTML = isExternal
    ? `
      <a class="button primary" href="${file}">Abrir enlace</a>
      <button class="button" type="button" data-close-resource>Cerrar</button>
    `
    : `
      <a class="button primary" href="${file}" download>Descargar</a>
      <button class="button" type="button" data-close-resource>Cerrar</button>
    `;

  const dialog = $("#resource-dialog");
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function mapSupabaseData({ jornada, sesiones = [], ponentes = [], recursos = [], sedes = [], siteContent = {} }) {
  const modalidad = jornada?.modalidad || "Preferentemente presencial, con opción online por Teams";
  const teamsUrl = jornada?.teams_url || "Enlace Teams pendiente de confirmar";
  const mappedSessions = sesiones.map((session, index) => {
    const sessionSpeakers = (session.sesion_ponentes || [])
      .sort((a, b) => (a.orden || 0) - (b.orden || 0))
      .map((item) =>
        item.ponentes
          ? {
              id: item.ponentes.id,
              nombre: item.ponentes.nombre,
              especialidad: item.ponentes.especialidad,
              centro: item.ponentes.centro,
              bio: item.ponentes.bio,
              foto_url: item.ponentes.foto_url,
              rol_persona: item.ponentes.rol_persona || "ponente",
              rol_sesion: item.rol || "Ponente"
            }
          : null
      )
      .filter(Boolean);

    const sessionResources = recursos.filter((resource) => resource.sesion_id === session.id);

    return {
      id: session.orden || index + 1,
      orden: session.orden || index + 1,
      uuid: session.id,
      slug: session.slug,
      titulo: session.titulo,
      bloque: session.bloque || `Sesión ${session.orden || index + 1}`,
      descripcion: session.descripcion || "Pendiente de confirmar",
      objetivo: session.objetivo || "Pendiente de confirmar",
      objetivos_docentes: session.objetivos_docentes || "",
      metodologia: session.metodologia || "",
      contenidos_clave: session.contenidos_clave?.length ? session.contenidos_clave : ["Pendiente de confirmar"],
      bibliografia: session.bibliografia || "",
      responsable_revision: session.responsable_revision || "",
      fecha_revision: formatDate(session.fecha_revision),
      material_previo: session.material_previo || "",
      material_posterior: session.material_posterior || "",
      fecha: formatDate(session.fecha),
      hora_inicio: formatTime(session.hora_inicio),
      hora_fin: formatTime(session.hora_fin),
      sede: session.sedes?.nombre || "Pendiente de confirmar",
      ponentes: sessionSpeakers.length ? sessionSpeakers.map((speaker) => speaker.nombre) : ["Pendiente de confirmar"],
      ponentes_detalle: sessionSpeakers,
      imagen: session.imagen_url || "",
      recursos: sessionResources.map((resource) => resource.titulo),
      estado: session.estado || "publicada",
      is_active: session.is_active
    };
  });
  const sessionSpeakerIds = new Set();
  mappedSessions.forEach((session) => {
    (session.ponentes_detalle || []).forEach((speaker) => {
      if (String(speaker.rol_sesion || "").toLowerCase().includes("ponente")) {
        sessionSpeakerIds.add(speaker.id);
      }
    });
  });

  return {
    programa: {
      nombre: jornada?.titulo || "Jornadas Docentes de Atención Primaria",
      subtitulo: jornada?.subtitulo || "Programa anual de sesiones clínicas para profesionales de Atención Primaria",
      ciclo: jornada?.curso || "2026-2027",
      descripcion: jornada?.descripcion || "Espacio docente anual para profesionales de Atención Primaria.",
      enfoque: "",
      modalidad,
      modalidad_resumen: modalidad.includes("Teams") ? "Presencial preferente + Teams" : modalidad,
      enlace_teams: teamsUrl,
      periodicidad: "Mensual",
      duracion: "45-60 minutos por sesión",
      dirigido_a: "Profesionales sanitarios",
      icono: "assets/icons/icon-512.png"
    },
    metodologia: [],
    objetivos: [],
    sesiones: mappedSessions.filter(isVisibleSession).sort(compareSessions),
    siteContent,
    ponentes: ponentes.map((speaker) => ({
      id: speaker.id,
      nombre: speaker.nombre,
      rol: PERSON_ROLE_LABELS[speaker.rol_persona] || "Ponente",
      rol_persona: speaker.rol_persona || "ponente",
      es_ponente_sesion: sessionSpeakerIds.has(speaker.id),
      especialidad: speaker.especialidad || "Pendiente de confirmar",
      centro: speaker.centro || "",
      bio: speaker.bio || "Pendiente de confirmar",
      foto_url: speaker.foto_url || "",
      sesiones: []
    })),
    recursos: recursos.filter(isPublicResource).map((resource) => ({
      id: resource.id,
      titulo: resource.titulo,
      tipo: resource.tipo,
      formato: resource.tipo?.toUpperCase() || "OTRO",
      archivo: resource.url,
      categoria: resource.categoria,
      sesion_id: resource.sesion_id
    })),
    sedes: sedes.map((venue) => ({
      id: venue.id,
      nombre: venue.nombre,
      direccion: venue.direccion || "Pendiente de confirmar",
      descripcion: venue.notas || "Pendiente de confirmar"
    })),
    contacto: {
      coordinacion: "Pendiente de confirmar",
      email: "Pendiente de confirmar",
      telefono: "Pendiente de confirmar"
    }
  };
}

async function loadSupabaseSiteContent(supabase, fallbackSiteContent) {
  try {
    const { data, error } = await supabase.from("site_settings").select("key,value").order("key", { ascending: true });
    if (error) throw error;
    console.info("Textos cargados desde Supabase");
    return settingRowsToContent(data || [], fallbackSiteContent);
  } catch (error) {
    console.warn("Textos de Supabase no disponibles, usando fallback local", error);
    console.info("Textos cargados desde fallback local");
    return fallbackSiteContent;
  }
}

async function loadSupabaseData(fallbackSiteContent) {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;
  const siteContent = await loadSupabaseSiteContent(supabase, fallbackSiteContent);

  const [{ data: jornadas, error: jornadaError }, { data: sesiones, error: sesionesError }, { data: ponentes, error: ponentesError }, { data: recursos, error: recursosError }, { data: sedes, error: sedesError }] = await Promise.all([
    supabase.from("jornadas").select("*").limit(1),
    supabase
      .from("sesiones")
      .select("*, sedes(nombre), sesion_ponentes(rol, orden, ponentes(*))")
      .in("estado", PUBLIC_SESSION_STATES)
      .eq("is_active", true)
      .order("fecha", { ascending: true, nullsFirst: false })
      .order("orden", { ascending: true }),
    supabase.from("ponentes").select("*").eq("is_active", true).order("nombre", { ascending: true }),
    supabase.from("recursos").select("*").eq("visible", true).order("orden", { ascending: true }),
    supabase.from("sedes").select("*").order("nombre", { ascending: true })
  ]);

  const error = jornadaError || sesionesError || ponentesError || recursosError || sedesError;
  if (error) throw error;
  if (!jornadas?.[0]) return null;
  if (ponentes?.length && !Object.prototype.hasOwnProperty.call(ponentes[0], "rol_persona")) {
    throw new Error("Ejecuta supabase/migration-session-speakers.sql para activar roles de personas.");
  }

  return mapSupabaseData({
    jornada: jornadas[0],
    sesiones: sesiones || [],
    ponentes: ponentes || [],
    recursos: recursos || [],
    sedes: sedes || [],
    siteContent
  });
}

async function loadJsonData() {
  const response = await fetch("data/jap.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadData() {
  const fallbackData = await loadJsonData();
  const fallbackSiteContent = flattenSiteContent(fallbackData.siteContent);
  try {
    const supabaseData = await loadSupabaseData(fallbackSiteContent);
    if (supabaseData) {
      state.dataSource = "supabase";
      console.info("Datos cargados desde Supabase");
      return supabaseData;
    }
  } catch (error) {
    console.warn("Supabase no disponible, usando data/jap.json", error);
  }

  state.dataSource = "json";
  const jsonData = { ...fallbackData, siteContent: fallbackSiteContent, sesiones: (fallbackData.sesiones || []).filter(isVisibleSession).sort(compareSessions) };
  console.info("Datos cargados desde JSON local por fallback");
  console.info("Textos cargados desde fallback local");
  return jsonData;
}

function showResource(resourceId) {
  openResource(state.data.recursos.find((item) => item.id === resourceId));
}

function showSessionPoster(slug) {
  if ($("#session-dialog").open) {
    closeSessionDialog();
  }
  openResource(getSessionPosterResource(slug));
}

function closeResourceDialog() {
  const dialog = $("#resource-dialog");
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

function getViewFromHash() {
  const hash = window.location.hash.replace("#", "");
  return VIEW_IDS.includes(hash) ? hash : "inicio";
}

function setActiveView(viewId, { updateHash = true } = {}) {
  const nextView = VIEW_IDS.includes(viewId) ? viewId : "inicio";
  state.activeView = nextView;

  $$("[data-view]").forEach((section) => {
    section.hidden = section.dataset.view !== nextView;
  });

  $$(".site-nav a, .brand, .quick-links a").forEach((link) => {
    const linkView = link.getAttribute("href")?.replace("#", "");
    if (!VIEW_IDS.includes(linkView)) return;
    if (linkView === nextView) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  $("#nav-principal").classList.remove("is-open");
  $(".menu-toggle").setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  if (updateHash && window.location.hash !== `#${nextView}`) {
    history.pushState(null, "", `#${nextView}`);
  }
}

function bindInteractions() {
  $(".menu-toggle").addEventListener("click", (event) => {
    const nav = $("#nav-principal");
    const isOpen = nav.classList.toggle("is-open");
    event.currentTarget.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    const viewLink = event.target.closest("a[href^='#']");
    const viewId = viewLink?.getAttribute("href").replace("#", "");
    if (VIEW_IDS.includes(viewId)) {
      event.preventDefault();
      setActiveView(viewId);
      return;
    }

    if (event.target.closest("[data-open-welcome]")) {
      showWelcome();
    }

    const trigger = event.target.closest("[data-session]");
    if (trigger) {
      showSession(trigger.dataset.session);
    }

    const resourceTrigger = event.target.closest("[data-resource]");
    if (resourceTrigger) {
      showResource(resourceTrigger.dataset.resource);
    }

    const posterTrigger = event.target.closest("[data-session-poster]");
    if (posterTrigger) {
      showSessionPoster(posterTrigger.dataset.sessionPoster);
    }

    if (event.target.closest("[data-close-session]")) {
      closeSessionDialog();
    }

    if (event.target.closest("[data-close-resource]")) {
      closeResourceDialog();
    }

    if (event.target.closest("[data-close-welcome]")) {
      closeWelcomeDialog();
    }
  });

  $("#session-dialog").addEventListener("click", (event) => {
    if (event.target.id === "session-dialog") {
      closeSessionDialog();
    }
  });

  $("#resource-dialog").addEventListener("click", (event) => {
    if (event.target.id === "resource-dialog") {
      closeResourceDialog();
    }
  });

  $("#welcome-dialog").addEventListener("click", (event) => {
    if (event.target.id === "welcome-dialog") {
      closeWelcomeDialog();
    }
  });

  window.addEventListener("hashchange", () => {
    setActiveView(getViewFromHash(), { updateHash: false });
  });

  window.addEventListener("popstate", () => {
    setActiveView(getViewFromHash(), { updateHash: false });
  });
}

async function init() {
  bindInteractions();
  setActiveView(getViewFromHash(), { updateHash: false });

  try {
    state.data = await loadData();

    renderSiteContent();
    renderWelcome();
    renderProgram(state.data.programa);
    renderAgenda(state.data.sesiones);
    renderSessions(state.data.sesiones);
    renderSpeakers(state.data.ponentes);
    renderResources(state.data.recursos);
    renderContact(state.data.contacto);
  } catch (error) {
    $("#program-description").textContent = "No se han podido cargar los datos locales del programa.";
    console.error("Error cargando data/jap.json", error);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service worker no registrado", error);
    });
  }
}

init();
