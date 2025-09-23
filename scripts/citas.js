document.addEventListener("DOMContentLoaded", () => {
  // ===============================
  // Funciones principales
  // ===============================
  function obtenerIdToken(token) {
    try {
      const payloadBase64 = token.split(".")[1];
      const payloadJSON = atob(payloadBase64);
      const payload = JSON.parse(payloadJSON);
      return payload.id || payload.user_id || payload.sub || null;
    } catch (error) {
      //console.error("Error al decodificar el token:", error);
      return null;
    }
  }
  cargarCitasPendientes();
  cargarCitasFinalizadas();

  horariosDisponibles();

  // ===============================
  // Registro nueva cita
  // ===============================
  const form = document.getElementById("form-nueva-cita");
  if (form) {
    form.addEventListener("submit", registroCita);
  }

  async function registroCita(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return mostrarMensajeExpirado();

    const fechaCita = document.getElementById("fecha-cita").value;
    const horarioCita = document.getElementById("horas-disponibles").value;
    const fechaHoraCita = `${fechaCita}T${horarioCita}:00`;

    const bicisSeleccionadas = Array.from(
    document.querySelectorAll("#lista-bicis input[type='checkbox']:checked")
  ).map(chk => chk.value);
    //console.log(bicisSeleccionadas);


    
    const data = {
      idUsuario: obtenerIdToken(token),
      fechaHoraCita,
      tipoMantenimiento: document.getElementById("tipo_mantenimiento").value,
      descripcionCita: document.getElementById("descripcion").value,
      bicis : bicisSeleccionadas
    };
    
   // console.log(data);
   

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
       // console.log("fecha de entrega:", fechaEntrega);

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
// Cargar citas pendientes
// ===============================
async function cargarCitasPendientes() {
  try {
    const res = await secureFetch(`${CONFIG.API_URL}/api/citas/mis_citas`, {
      method: "GET",
    });

    if (!res.ok) throw new Error("No se pudo cargar citas");

    const citas = await res.json();
    const listadoCitasPendientes = document.getElementById("tablaCitas");
    listadoCitasPendientes.innerHTML = ""; // limpiar antes de agregar

    const btnConfirmar = document.getElementById("btnConfirmarCancelar");
    const modalElement = document.getElementById("modalConfirmarCancelar");

    citas.forEach((cita) => {
      const fila = document.createElement("tr");

      // Verificar si el botón debe estar deshabilitado
      const isDisabled = cita.estado !== "pendiente";
      const botonClass = isDisabled ? "btn-secondary" : "btn-danger";
      const botonPointer = isDisabled ? "style='pointer-events: none;'" : "";
      const tooltip = isDisabled
        ? "Solo se pueden cancelar citas pendientes"
        : "Cancelar cita";

      // Mensaje adicional si la cita ya está finalizada
      let mensajeEstado = cita.estado;
      if (cita.estado === "finalizado") {
        mensajeEstado = `<span class="text-success">${cita.estado} - ¡Tu bici está lista!</span>`;
      }

      fila.innerHTML = `
        <td>${cita.id}</td>
        <td>${new Date(cita.fecha_entrega).toLocaleString()}</td>
        <td>${mensajeEstado}</td>
        <td>
          <button class="btn btn-sm ${botonClass} btn-cancelar-cita" 
                  data-id="${cita.id}" 
                  data-bs-toggle="tooltip" 
                  data-bs-placement="top"
                  title="${tooltip}"
                  ${botonPointer}>
            Cancelar
          </button>
        </td>
      `;

      listadoCitasPendientes.appendChild(fila);
    });

    // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Asignar evento a los botones de cancelar dinámicamente
    document.querySelectorAll(".btn-cancelar-cita").forEach((boton) => {
      boton.addEventListener("click", () => {
        const citaId = boton.dataset.id;

        // Solo abrir modal si la cita está pendiente
        if (boton.classList.contains("btn-danger")) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();

          // Asignar id al botón de confirmar cancelación
          btnConfirmar.dataset.id = citaId;
        }
      });
    });

    // Evento de confirmar cancelación
    btnConfirmar.onclick = async () => {
      const citaId = btnConfirmar.dataset.id;
      if (!citaId) return;

      try {
        const resultado = await editarCita(citaId, { estado: "cancelado" });
        console.log("Cita cancelada:", resultado);

        // Cerrar modal y recargar citas
        bootstrap.Modal.getInstance(modalElement).hide();
        btnConfirmar.dataset.id = ""; // limpiar id
        cargarCitasPendientes();
      } catch (error) {
        alert("No se pudo cancelar la cita seleccionada");
        console.error(error);
      }
    };
  } catch (error) {
    console.error("Error al procesar citas:", error);
  }
}



  // ===============================
  // Cargar citas finalizadas/canceladas
  // ===============================

  async function cargarCitasFinalizadas() {
  try {
    const res = await secureFetch(
      `${CONFIG.API_URL}/api/citas/mis_citas_finalizadas`,
      { method: "GET" }
    );

    if (!res.ok) throw new Error("No se pudo cargar citas");

    const citas = await res.json();
    const listadoCitasFinalizadas = document.getElementById("tablaCitasFinalizadas");
    listadoCitasFinalizadas.innerHTML = ""; // limpiar antes de agregar

    citas.forEach((cita) => {
      const fila = document.createElement("tr");

      // Definir estilo y mensaje según el estado
      let estadoHTML = "";
      if (cita.estado === "cancelado") {
        estadoHTML = `<span class="text-danger">Cancelado</span>`;
      } else if (cita.estado === "entregado") {
        estadoHTML = `<span class="text-success">Entregado</span>`;
      } else {
        estadoHTML = cita.estado; // otros estados, si los hay
      }

      fila.innerHTML = `
        <td>${cita.id}</td>
        <td>${new Date(cita.fecha_entrega).toLocaleString()}</td>
        <td>${estadoHTML}</td>
      `;

      listadoCitasFinalizadas.appendChild(fila);
    });

  } catch (error) {
    console.error("Error al procesar citas:", error);
  }
}


  //Establecer fecha minima para registrar cita
  fechaMinima();

  //Editar cita
  
  async function editarCita(id, data) {
    const token = localStorage.getItem("token");
    if (!token) return mostrarMensajeExpirado();

    try {
      const res = await secureFetch(
        `${CONFIG.API_URL}/api/citas/editar_cita/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        throw new Error(`Error en la petición: ${res.status}`);
      }
    } catch (error) {
      throw new Error(`Error en la petición: ${res.status}`);
      throw error;
    }
  }

  let citaSeleccionada = null;

  /* const modal = document.getElementById("modalConfirmarCancelar");

  // Evento que se dispara cuando el modal se va a mostrar
  modal.addEventListener("show.bs.modal", (event) => {
    // `event.relatedTarget` es el botón que disparó el modal
    const boton = event.relatedTarget;
    citaSeleccionada = boton.getAttribute("data-id");
    //console.log("Cita seleccionada:", citaSeleccionada);
  });

  document
    .getElementById("btnConfirmarCancelar")
    .addEventListener("click", async () => {
      if (!citaSeleccionada) return;
      try {
        const resultado = await editarCita(citaSeleccionada, {
          estado: "cancelado",
        });
        console.log("Cita cancelada:", resultado);

        setTimeout(() => {
          bootstrap.Modal.getInstance(modal).hide();
          citaSeleccionada = null;
          cargarCitasPendientes();
        }, 2000);
      } catch (error) {
        alert("Nose puedo cancelar la cita seleccionada");
      }
    }); */

  // ===============================
  // Cargar bicis nueva cita
  // ===============================

  const botonCita = document.getElementById("btn-modal-cita");

  botonCita.addEventListener("click", cargarBicisCita);

  async function cargarBicisCita() {
   // console.log("click en el boton del modal ...");
    const token = localStorage.getItem("token");
    if (!token) return mostrarMensajeExpirado();
    try {
      const res = await secureFetch(`${CONFIG.API_URL}/api/bicis/mis_bicis`, {
        method: "GET",
      });
      if (!res) throw new Error("No se pudo cargar las bicis");

      const bicis = await res.json();
     // console.log(bicis);
      crearListadoBicis(bicis);
    } catch (error) {
      //console.error("Error al cargar bicis:", error);
    }
  }

function crearListadoBicis(bicis) {
  const lista = document.getElementById("lista-bicis");
  lista.innerHTML = ""; // Limpiar contenido previo

  if (bicis.length === 0) {
    // Mostrar mensaje y botón si no hay bicis
    const div = document.createElement("div");
    div.classList.add("text-center", "my-3");

    const mensaje = document.createElement("p");
    mensaje.textContent = "No tienes bicis registradas";
    div.appendChild(mensaje);

    const btnAgregar = document.createElement("a");
    btnAgregar.classList.add("btn", "btn-primary");
    btnAgregar.href = "bicis_cliente.html"; // Ajusta la ruta a tu página de registro
    btnAgregar.textContent = "Agregar bici";
    div.appendChild(btnAgregar);

    lista.appendChild(div);
    return;
  }

  // Si hay bicis, generar checkboxes
  bicis.forEach((bici, index) => {
    const li = document.createElement("li");
    const div = document.createElement("div");
    div.classList.add("form-check");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.classList.add("form-check-input");
    input.value = bici.bici_id;
    input.id = `chk${index + 1}`;

    const label = document.createElement("label");
    label.classList.add("form-check-label");
    label.setAttribute("for", `chk${index + 1}`);
    label.textContent = bici.modelo;

    div.appendChild(input);
    div.appendChild(label);
    li.appendChild(div);
    lista.appendChild(li);
  });
}




});
