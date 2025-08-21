document.addEventListener("DOMContentLoaded", () => {
    // ===============================
  // Funciones principales 
  // ===============================

cargarCitasPendientes();
cargarCitasFinalizadas();


  horariosDisponibles();

  // ===============================
  // Decodificar token
  // ===============================
  function obtenerIdToken(token) {
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJSON = atob(payloadBase64);
      const payload = JSON.parse(payloadJSON);
      return payload.id || payload.user_id || payload.sub || null;
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return null;
    }
  }

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

    const fechaCita= document.getElementById("fecha-cita").value
    const horarioCita= document.getElementById("horas-disponibles").value
    const fechaHoraCita = `${fechaCita}T${horarioCita}:00`;

    const data = {
      idUsuario: obtenerIdToken(token),
      cantidadBicis: document.getElementById("cantidad_bici").value,
      fechaHoraCita,
      tipoMantenimiento: document.getElementById("tipo_mantenimiento").value,
      descripcionCita: document.getElementById("descripcion").value,
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
      if (!res.ok) throw new Error(resultado.error || "Error al registrar cita");

      const mensajeExito = document.getElementById("mensaje-exito");
      if (mensajeExito) {
       const fechaEntrega = new Date(resultado.fecha_entrega).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  });
  console.log("fecha de entrega:", fechaEntrega)

  mensajeExito.innerHTML = `
    ✅ Cita registrada con éxito.<br>
    <strong>Número de cita:</strong> ${resultado.idCita}<br>
    <strong>Fecha estimada de entrega:</strong> ${fechaEntrega}
  `;
  mensajeExito.classList.remove("d-none");

      }

      setTimeout(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById("modalNuevaCita"));
        if (modal) modal.hide();

        if (mensajeExito) mensajeExito.classList.add("d-none");
        // Limpiar formulario
  const form = document.getElementById("form-nueva-cita");
  if (form){
    form.reset();
    recargarPagina();
  } 
      }, 5000);
    } catch (error) {
      console.error("Error en el registro:", error);
      const mensajeDiv = document.getElementById("mensaje-error");
      if (mensajeDiv) {
        mensajeDiv.textContent = error.message || "Ocurrió un error al registrar la cita.";
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

    citas.forEach((cita) => {
      const fila = document.createElement("tr");

      fila.innerHTML = `
        <td>${cita.id}</td>
        <td>${new Date(cita.fecha_entrega).toLocaleString()}</td>
        <td>${cita.estado}</td>
        <td><button class="btn btn-sm btn-danger btn-cancelar-cita" data-id="${cita.id}" data-bs-toggle="modal" data-bs-target="#modalConfirmarCancelar">Cancelar</button></td>
      `;

      listadoCitasPendientes.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al procesar citas:", error);
  }
}

// ===============================
  // Cargar citas finalizadas/canceladas
  // ===============================

  async function cargarCitasFinalizadas() {
  try {
    const res = await secureFetch(`${CONFIG.API_URL}/api/citas/mis_citas_finalizadas`, {
      method: "GET",
    });

    if (!res.ok) throw new Error("No se pudo cargar citas");

    const citas = await res.json();
    const listadoCitasPendientes = document.getElementById("tablaCitasFinalizadas");
    listadoCitasPendientes.innerHTML = ""; // limpiar antes de agregar

    citas.forEach((cita) => {
      const fila = document.createElement("tr");

      fila.innerHTML = `
        <td>${cita.id}</td>
        <td>${new Date(cita.fecha_entrega).toLocaleString()}</td>
        <td>${cita.estado}</td>
      `;

      listadoCitasPendientes.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al procesar citas:", error);
  }
}


//Establecer fecha minima para registrar cita 
fechaMinima();



//Editar cita
//agregar validacion, no se puede cancelar una cita en proceso o finalizada
async function editarCita(id, data) {

  const token = localStorage.getItem("token");
  if (!token) return mostrarMensajeExpirado();

  
  try{
    const res = await secureFetch(`${CONFIG.API_URL}/api/citas/editar_cita/${id}`,{
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
     if (!res.ok) {
      throw new Error(`Error en la petición: ${res.status}`);
    }

  }catch(error){
    throw new Error(`Error en la petición: ${res.status}`);
    throw error;
  }

  
}

let citaSeleccionada = null;

const modal = document.getElementById("modalConfirmarCancelar");

// Evento que se dispara cuando el modal se va a mostrar
modal.addEventListener("show.bs.modal", event => {
  // `event.relatedTarget` es el botón que disparó el modal
  const boton = event.relatedTarget;
  citaSeleccionada = boton.getAttribute("data-id");
  console.log("Cita seleccionada:", citaSeleccionada);
});

document.getElementById("btnConfirmarCancelar").addEventListener("click", async ()=>{
if (!citaSeleccionada) return;
try{
const resultado = await editarCita(citaSeleccionada, {estado:"cancelado"});
console.log("Cita cancelada:", resultado);

setTimeout(() => {
  bootstrap.Modal.getInstance(modal).hide();
      citaSeleccionada = null;
      cargarCitasPendientes();
      
      
    }, 2000);


}catch(error)
{
alert("Nose puedo cancelar la cita seleccionada");
}
})


});