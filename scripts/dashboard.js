// ===============================
// Funciones Utilitarias
// ===============================

function limpiarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const form = modal.querySelector("form");
  if (form) form.reset();

  const nombreCliente = document.getElementById("nombre-cliente");
  const listaBicis = document.getElementById("lista-bicis");
  if (nombreCliente) nombreCliente.innerHTML = "";
  if (listaBicis) listaBicis.innerHTML = "";
}

function mostrarMensajeExpirado() {
  alert("Sesión expirada. Inicia sesión nuevamente.");
  window.location.href = "index.html";
}

function recargarPagina() {
  window.location.reload();
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return "";
  const fecha = new Date(fechaStr);
  return fecha.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

// ===============================
// Carga de Clientes y Bicis
// ===============================

async function cargarCliente(id) {
  try {
    const res = await secureFetch(`${CONFIG.API_URL}/api/usuarios/${id}`, { method: "GET" });
    const cliente = await res.json();
    if (!res.ok) throw new Error(cliente.error || "No se encontró el cliente");

    document.getElementById("nombre-cliente").innerHTML = `
      <span class="fw-bold">Nombre Cliente: </span> ${cliente.nombre}
    `;

    cargarBicisCitaAdministrador(id);
  } catch (error) {
    console.error("Error al cargar cliente:", error);
    document.getElementById("nombre-cliente").innerHTML = `
      <div class="alert alert-danger p-2 mt-2" role="alert">
        Cliente no encontrado.
      </div>
      <a href="/usuarios.html" class="btn btn-sm btn-primary mt-2">Agregar usuario</a>
    `;
  }
}

async function cargarBicisCitaAdministrador(id_usuario) {
  const token = localStorage.getItem("token");
  if (!token) return mostrarMensajeExpirado();

  try {
    const res = await secureFetch(`${CONFIG.API_URL}/api/bicis/usuario/${id_usuario}`, { method: "GET" });
    const data = await res.json();
    const bicis = Array.isArray(data) ? data : [];
    const listaBicis = document.getElementById("lista-bicis");
    console.log(bicis)
    listaBicis.innerHTML = "";

    if (bicis.length === 0) {
      listaBicis.innerHTML = `
        <li class="dropdown-item text-center text-muted">No hay bicicletas registradas</li>
        <li><hr class="dropdown-divider"></li>
        <li class="dropdown-item text-center">
          <button class="btn btn-sm btn-success" data-bs-toggle="modal" data-bs-target="#modalNuevaBici">
            Registrar bici
          </button>
        </li>
      `;
    } else {
      bicis.forEach(bici => {
        const li = document.createElement("li");
        li.classList.add("dropdown-item");
        li.innerHTML = `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" value="${bici.bici_id}" id="bici-${bici.bici_id}">
            <label class="form-check-label" for="bici-${bici.id_bici}">
              ${bici.marca} ${bici.modelo} (${bici.tipo})
            </label>
          </div>
        `;
        listaBicis.appendChild(li);
      });
    }
  } catch (error) {
    console.error("Error al cargar bicis:", error);
  }
}

// ===============================
// Carga de Citas
// ===============================

async function cargarCitasTabla(fecha) {
  try {
    const res = await secureFetch(`${CONFIG.API_URL}/api/citas/?fecha=${fecha}`, { method: "GET" });
    if (!res) return;
    const listarCitas = await res.json();
    const tablaCitas = document.getElementById("tabla-citas");
    tablaCitas.innerHTML = "";

    listarCitas.forEach(cita => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${cita.id_cita}</td>
        <td>${formatearFecha(cita.fecha_ingreso)}</td>
        <td>${cita.cliente}</td>
        <td>${cita.tipo_mantenimiento}</td>    
        <td>${formatearFecha(cita.fecha_entrega_estimada)}</td>
        <td>${cita.estado}</td>
        <td>${cita.tecnico}</td>
        <td>
          <button class="btn btn-sm btn-primary btn-editar" data-bs-toggle="modal" data-id=${cita.id_cita} data-bs-target="#modalEditarCita">
            Editar
          </button>
        </td>
      `;
      tablaCitas.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al cargar citas:", error);
  }
}

async function cargarTodasCitas() {
  try {
    const res = await secureFetch(`${CONFIG.API_URL}/api/citas/?estado=pendiente`, { method: "GET" });
    if (!res) return;
    const listarCitas = await res.json();
    const tablaCitas = document.getElementById("tabla-citas");
    tablaCitas.innerHTML = "";

    listarCitas.forEach(cita => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${cita.id_cita}</td>
        <td>${formatearFecha(cita.fecha_ingreso)}</td>
        <td>${cita.cliente}</td>
        <td>${cita.tipo_mantenimiento}</td>    
        <td>${formatearFecha(cita.fecha_entrega_estimada)}</td>
        <td>${cita.estado}</td>
        <td>${cita.tecnico}</td>
        <td>
          <button class="btn btn-sm btn-primary btn-editar" data-bs-toggle="modal" data-id=${cita.id_cita} data-bs-target="#modalEditarCita">
            Editar
          </button>
        </td>
      `;
      tablaCitas.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al cargar todas las citas:", error);
  }
}

// ===============================
// Citas - Editar y Registrar Entrada
// ===============================

async function registrarEntrada(event, id) {
  if (!id) return;
  const token = localStorage.getItem("token");
  if (!token) return mostrarMensajeExpirado();
  const mensajeDiv = document.getElementById("mensaje-editar-cita");
  const mensajeExito = document.getElementById("mensaje-exito-editar-cita");
  const fechaEntrada = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const data = { fechaRecibo: fechaEntrada, estado: "en_proceso" };

  try {
    const res = await fetch(`${CONFIG.API_URL}/api/citas/editar_cita/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const resultado = await res.json();
    if (!res.ok) throw new Error(resultado.error || "Error al registrar entrada");

    mensajeExito.textContent = "¡Se registró la entrada correctamente!";
    mensajeExito.classList.remove("d-none");

    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditarCita"));
      if (modal) modal.hide();
      mensajeExito.classList.add("d-none");
      recargarPagina();
    }, 2000);
  } catch (error) {
    mensajeDiv.textContent = error.message || "Ocurrió un error al actualizar.";
    mensajeDiv.classList.remove("d-none");
  }
}

async function editarCita(event, id) {
  if (!id) return;
  const token = localStorage.getItem("token");
  if (!token) return mostrarMensajeExpirado();
  const mensajeDiv = document.getElementById("mensaje-editar-cita");
  const mensajeExito = document.getElementById("mensaje-exito-editar-cita");

  const data = {
    fechaEntrega: document.getElementById("fecha-entrega-estimada").value,
    tipoMantenimiento: document.getElementById("tipo-servicio").value,
    estado: document.getElementById("estado-cita").value,
    tecnico: document.getElementById("tecnico").value,
    descripcion: document.getElementById("detalles-servicio").value,
  };

  try {
    const res = await fetch(`${CONFIG.API_URL}/api/citas/editar_cita/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });

    const resultado = await res.json();
    if (!res.ok) throw new Error(resultado.error || "Error al registrar entrada");

    mensajeExito.textContent = "¡Se actualizó correctamente!";
    mensajeExito.classList.remove("d-none");

    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditarCita"));
      if (modal) modal.hide();
      mensajeExito.classList.add("d-none");
      recargarPagina();
    }, 2000);
  } catch (error) {
    mensajeDiv.textContent = error.message || "Ocurrió un error al actualizar.";
    mensajeDiv.classList.remove("d-none");
  }
}

// ===============================
// Consultar Cita
// ===============================

async function consultarCita(id) {
  try {
    const res = await secureFetch(`${CONFIG.API_URL}/api/citas/${id}`, { method: "GET" });
    if (!res) return;

    const cita = await res.json();
    document.getElementById("folio-cita").textContent = id;
    document.getElementById("cliente-nombre").textContent = cita.usuario;
    document.getElementById("tipo-servicio").value = cita.servicio;
    document.getElementById("estado-cita").value = cita.estado;
    document.getElementById("detalles-servicio").value = cita.descripcion;
    document.getElementById("tecnico").value = cita.tecnico;

    if (cita.fecha_entrega) {
      const fechaValida = cita.fecha_entrega.replace(" ", "T").slice(0, 16);
      document.getElementById("fecha-entrega-estimada").value = fechaValida;

      const botonEntrada = document.getElementById("btn-dar-entrada");
      botonEntrada.disabled = cita.estado !== "pendiente";
    }
  } catch (error) {
    alert("No se pudo cargar el usuario");
  }
}
//Registro nueva cita 

  async function registroCita(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return mostrarMensajeExpirado();

    const fechaCita = document.getElementById("fecha-cita").value;
    const horarioCita = document.getElementById("horas-disponibles").value;
    const fechaHoraCita = `${fechaCita}T${horarioCita}:00`;
    const idUsuario = document.getElementById("id-cliente").value;

    const bicisSeleccionadas = Array.from(
    document.querySelectorAll("#lista-bicis input[type='checkbox']:checked")
  ).map(chk => chk.value);
    console.log(idUsuario);


    
    const data = {
      idUsuario: idUsuario,
      fechaHoraCita,
      tipoMantenimiento: document.getElementById("tipo_mantenimiento").value,
      descripcionCita: document.getElementById("descripcion").value,
      bicis : bicisSeleccionadas
    };
    
    console.log(data);
   

    try {
      const res = await fetch(`${CONFIG.API_URL}/api/citas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const resultado = await res.json();
      if (!res.ok)
        throw new Error(resultado.error || "Error al registrar cita");

      const mensajeExito = document.getElementById("mensaje-exito");
      if (mensajeExito) {
        const fechaEntrega = new Date(resultado.fecha_entrega).toLocaleString(
          "es-MX",
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        );
       

        mensajeExito.innerHTML = `
    ✅ Cita registrada con éxito.<br>
    <strong>Número de cita:</strong> ${resultado.idCita}<br>
    <strong>Fecha estimada de entrega:</strong> ${fechaEntrega}
  `;
        mensajeExito.classList.remove("d-none");
      }

      setTimeout(() => {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("modalNuevaCita")
        );
        if (modal) modal.hide();

        if (mensajeExito) mensajeExito.classList.add("d-none");
        // Limpiar formulario
        const form = document.getElementById("form-nueva-cita");
        if (form) {
          form.reset();
          recargarPagina();
        }
      }, 5000);
    } catch (error) {
      console.error("Error en el registro:", error);
      const mensajeDiv = document.getElementById("mensaje-error");
      if (mensajeDiv) {
        mensajeDiv.textContent =
          error.message || "Ocurrió un error al registrar la cita.";
        mensajeDiv.classList.remove("d-none");
      }
    }
  }


// ===============================
// Registrar Eventos
// ===============================

 const form = document.getElementById("form-nueva-cita");
  if (form) {
    form.addEventListener("submit", registroCita);
  }

function registrarEventos() {
  const tablaCitas = document.getElementById("tabla-citas");
  let idCitaActual = "";

  tablaCitas.addEventListener("click", e => {
    if (e.target.classList.contains("btn-editar")) {
      idCitaActual = e.target.dataset.id;
      consultarCita(idCitaActual);
    }
  });

  document.getElementById("btn-dar-entrada").addEventListener("click", e => registrarEntrada(e, idCitaActual));
  document.getElementById("btn-actualizar").addEventListener("click", e => editarCita(e, idCitaActual));
}

// ===============================
// Inicialización
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("token")) {
    alert("Acceso no autorizado. Inicia sesión.");
    window.location.href = "index.html";
    return;
  }

  usuarioActual();
  const hoy = new Date().toISOString().split("T")[0];

  cargarTodasCitas();
  fechaMinima();
  horariosDisponibles();
  registrarEventos();

  // Botón cargar cliente
  document.getElementById("btn-cargar-cliente").addEventListener("click", () => {
    const id = document.getElementById("id-cliente").value.trim();
    if (!id) return alert("Ingresa un ID válido");
    cargarCliente(id);
  });

  // Botón cancelar modal cita
  const btnCancelar = document.getElementById("cancelarModalCita");
  btnCancelar.addEventListener("click", () => limpiarModal("modalNuevaCita"));

  // Filtro por fecha
  document.getElementById("filtroFecha").addEventListener("change", e => {
    const fecha = e.target.value || new Date().toISOString().split("T")[0];
    cargarCitasTabla(fecha);
  });

  // Filtro por estado
  document.getElementById("filtro-estado").addEventListener("change", e => {
    const estadoSeleccionado = e.target.value.toLowerCase();
    document.querySelectorAll("table tbody tr").forEach(fila => {
      const filaEstado = fila.cells[5].textContent.toLowerCase();
      fila.style.display = estadoSeleccionado === "todos" || filaEstado.includes(estadoSeleccionado) ? "" : "none";
    });
  });

  // Buscador de citas
  document.getElementById("buscadorCitas").addEventListener("input", function () {
    const filtro = this.value.toLowerCase();
    document.querySelectorAll("table tbody tr").forEach(fila => {
      const folio = fila.cells[0].textContent.toLowerCase();
      const cliente = fila.cells[2].textContent.toLowerCase();
      fila.style.display = folio.includes(filtro) || cliente.includes(filtro) ? "" : "none";
    });
  });
});
