import { getSupabaseClient } from "./supabase-client.js";

const state = {
  data: null,
  activeView: "inicio",
  dataSource: "json"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const VIEW_IDS = ["inicio", "agenda", "sesiones", "ponentes", "recursos", "contacto"];

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

function renderProgram(programa) {
  $("#program-description").textContent = programa.descripcion;
  $("#program-modality-short").textContent = programa.modalidad_resumen || programa.modalidad;
  $("#program-duration-short").textContent = programa.duracion.replace("utos por sesión", "");
}

function renderAgenda(sesiones) {
  $("#agenda-list").innerHTML = sesiones
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
    .join("");
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
  $("#session-grid").innerHTML = sesiones
    .map(
      (session) => `
        <article class="session-card">
          <div class="session-body">
            <p class="eyebrow">${escapeHtml(session.bloque)}</p>
            <h3>${escapeHtml(session.titulo)}</h3>
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
      `
    )
    .join("");
}

function renderSpeakers(ponentes) {
  const speakerMarkup = ponentes.length
    ? ponentes
        .map(
          (speaker) => `
            <article class="speaker-card">
              <h3>${escapeHtml(speaker.nombre)}</h3>
              <p><strong>${escapeHtml(speaker.rol)}</strong></p>
              <p>${escapeHtml(speaker.bio)}</p>
            </article>
          `
        )
        .join("")
    : '<article class="speaker-card"><h3>Pendiente de confirmar</h3><p>La información de ponentes se añadirá cuando esté disponible.</p></article>';

  $("#speaker-grid").innerHTML = speakerMarkup;
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
  $("#contact-card").innerHTML = `
    <p><strong>Coordinación</strong><br>${escapeHtml(contacto.coordinacion)}</p>
    <p><strong>Email</strong><br>${escapeHtml(contacto.email)}</p>
    <p><strong>Teléfono</strong><br>${escapeHtml(contacto.telefono)}</p>
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
        <div class="detail-box"><strong>Estado</strong>${escapeHtml(session.estado)}</div>
      </div>
      <h3>Ponentes</h3>
      <p>${session.ponentes.map(escapeHtml).join(", ")}</p>
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

function mapSupabaseData({ jornada, sesiones = [], ponentes = [], recursos = [], sedes = [] }) {
  const modalidad = jornada?.modalidad || "Preferentemente presencial, con opción online por Teams";
  const teamsUrl = jornada?.teams_url || "Enlace Teams pendiente de confirmar";
  const mappedSessions = sesiones.map((session, index) => {
    const sessionSpeakers = (session.sesion_ponentes || [])
      .sort((a, b) => (a.orden || 0) - (b.orden || 0))
      .map((item) => item.ponentes?.nombre)
      .filter(Boolean);

    const sessionResources = recursos.filter((resource) => resource.sesion_id === session.id);

    return {
      id: session.orden || index + 1,
      uuid: session.id,
      slug: session.slug,
      titulo: session.titulo,
      bloque: session.bloque || `Sesión ${session.orden || index + 1}`,
      descripcion: session.descripcion || "Pendiente de confirmar",
      objetivo: session.objetivo || "Pendiente de confirmar",
      contenidos_clave: session.contenidos_clave?.length ? session.contenidos_clave : ["Pendiente de confirmar"],
      fecha: formatDate(session.fecha),
      hora_inicio: formatTime(session.hora_inicio),
      hora_fin: formatTime(session.hora_fin),
      sede: session.sedes?.nombre || "Pendiente de confirmar",
      ponentes: sessionSpeakers.length ? sessionSpeakers : ["Pendiente de confirmar"],
      imagen: session.imagen_url || "",
      recursos: sessionResources.map((resource) => resource.titulo),
      estado: session.estado || "publicada"
    };
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
    sesiones: mappedSessions,
    ponentes: ponentes.map((speaker) => ({
      id: speaker.id,
      nombre: speaker.nombre,
      rol: [speaker.especialidad, speaker.centro].filter(Boolean).join(" · ") || "Pendiente de confirmar",
      bio: speaker.bio || "Pendiente de confirmar",
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

async function loadSupabaseData() {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;

  const [{ data: jornadas, error: jornadaError }, { data: sesiones, error: sesionesError }, { data: ponentes, error: ponentesError }, { data: recursos, error: recursosError }, { data: sedes, error: sedesError }] = await Promise.all([
    supabase.from("jornadas").select("*").limit(1),
    supabase
      .from("sesiones")
      .select("*, sedes(nombre), sesion_ponentes(rol, orden, ponentes(nombre))")
      .eq("estado", "publicada")
      .eq("is_active", true)
      .order("orden", { ascending: true }),
    supabase.from("ponentes").select("*").eq("is_active", true).order("nombre", { ascending: true }),
    supabase.from("recursos").select("*").eq("visible", true).order("orden", { ascending: true }),
    supabase.from("sedes").select("*").order("nombre", { ascending: true })
  ]);

  const error = jornadaError || sesionesError || ponentesError || recursosError || sedesError;
  if (error) throw error;
  if (!jornadas?.[0]) return null;

  return mapSupabaseData({
    jornada: jornadas[0],
    sesiones: sesiones || [],
    ponentes: ponentes || [],
    recursos: recursos || [],
    sedes: sedes || []
  });
}

async function loadJsonData() {
  const response = await fetch("data/jap.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadData() {
  try {
    const supabaseData = await loadSupabaseData();
    if (supabaseData) {
      state.dataSource = "supabase";
      console.info("Datos cargados desde Supabase");
      return supabaseData;
    }
  } catch (error) {
    console.warn("Supabase no disponible, usando data/jap.json", error);
  }

  state.dataSource = "json";
  const jsonData = await loadJsonData();
  console.info("Datos cargados desde JSON local por fallback");
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
