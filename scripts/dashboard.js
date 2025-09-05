// ===============================
// Eventos y Formularios
// ===============================

function registrarEventos(){
  const tablaCitas = document.getElementById("tabla-citas");
  let idCitaActual = "";

  tablaCitas.addEventListener("click", function(e){
    if(e.target.classList.contains("btn-editar")){
      idCitaActual =e.target.dataset.id;
      console.log("editar cita", idCitaActual);
      consultarCita(idCitaActual);
    }
  })

   document.getElementById("btn-dar-entrada").addEventListener("click", (e)=> registrarEntrada(e, idCitaActual));

}
// ===============================
// Editar Citas
// ===============================

async function registrarEntrada(event, id){

  //Validar que la cita este en un estado "pendiente" si no, lanzar un error
  if (!id) return;
  const token = localStorage.getItem("token");
  if (!token) return mostrarMensajeExpirado();
  const mensajeDiv = document.getElementById("mensaje-editar-cita");
  const mensajeExito = document.getElementById("mensaje-exito-editar-cita");
  const fechaEntrada = new Date().toISOString().slice(0, 19).replace('T', ' ');
  console.log("registrando entrada..id:", id, "fecha", fechaEntrada);
  data={"fechaRecibo": fechaEntrada, //la fecha no esta con hora local!!
    "estado": "en_proceso"
  }

  try {
    const res = await fetch(`${CONFIG.API_URL}/api/citas/editar_cita/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const resultado = await res.json();
    if (!res.ok) throw new Error(resultado.error || "Error al registrar entrada");

    mensajeExito.textContent = "¡Se registro la entrada correctamente exitosamente!";
    mensajeExito.classList.remove("d-none");
    

    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditarCita"));
      if (modal) modal.hide();
      mensajeExito.classList.add("d-none");
      recargarPagina();
    }, 2000);
  } catch (error) {
    console.error("Error en la actualización:", error);
    mensajeDiv.textContent = error.message || "Ocurrió un error al actualizar.";
    mensajeDiv.classList.remove("d-none");
  }


}




// ===============================
// Manejadores principales
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("token")) {
    alert("Acceso no autorizado. Inicia sesión.");
    window.location.href = "index.html";
    return;
  }
  usuarioActual();

  const hoy = new Date().toISOString().split('T')[0];

  cargarTodasCitas(); 
  fechaMinima();
  horariosDisponibles();
  registrarEventos();
  
});

async function consultarCita(id){
  const res = await secureFetch(`${CONFIG.API_URL}/api/citas/${id}`, {
    method: "GET",
  });
  if (!res) return;

  try {
    const cita = await res.json();
    console.log(cita)
    document.getElementById("folio-cita").textContent = id;
    document.getElementById("cliente-nombre").textContent = cita.usuario;
    document.getElementById("tipo-servicio").value = cita.servicio;
    document.getElementById("estado-cita").value = cita.estado;
    document.getElementById("detalles-servicio").value = cita.descripcion;
    document.getElementById("tecnico").value = cita.tecnico;
    
    if (cita.fecha_entrega) {
  // "2025-08-25 09:00:00" → "2025-08-25T09:00"
  const fechaValida = cita.fecha_entrega.replace(" ", "T").slice(0, 16);
  document.getElementById("fecha-entrega-estimada").value = fechaValida;
  const botonEntrada = document.getElementById("btn-dar-entrada");

  if(cita.estado !== "pendiente"){
    botonEntrada.disabled = true;
  }else{
    botonEntrada.disabled = false;
  }
}
    

  } catch (error) {
    console.error("Error al cargar usuario", error);
    alert("No se pudo cargar el usuario");
  }
}

//Filtrar por fecha
    document.getElementById("filtroFecha").addEventListener("change", e =>{
        const fechaSeleccionada = e.target.value;
        console.log(fechaSeleccionada)
         if (!fechaSeleccionada) {
            const hoy = new Date().toISOString().split('T')[0]; //fecha actual
        cargarCitasTabla(hoy); // Si no se selecciona ninguna fecha se muestran las citas del dia actual
        return;
    }

    cargarCitasTabla(fechaSeleccionada);

    
    })


  // ===============================
  // Buscador de citas
  // ===============================
    
document.getElementById('buscadorCitas').addEventListener('input', function () {
    const filtro = this.value.toLowerCase();
    const filas = document.querySelectorAll('table tbody tr');

    filas.forEach(fila => {
      const folio = fila.cells[0].textContent.toLowerCase();
      const cliente = fila.cells[2].textContent.toLowerCase();

      if (folio.includes(filtro) || cliente.includes(filtro)) {
        fila.style.display = '';
      } else {
        fila.style.display = 'none';
      }
    });
  });


  // ===============================
  // Llenar Tabla Dashboard
  // ===============================

  async function cargarCitasTabla(fecha) {

    try {
         const res = await secureFetch(`${CONFIG.API_URL}/api/citas/?fecha=${fecha}`, {
    method: "GET",
  });
  if (!res) return;

  const listarCitas = (await res.json());
  tablaCitas = document.getElementById("tabla-citas");
  tablaCitas.innerHTML = "";
  listarCitas.forEach((cita) =>{
    const fila = document.createElement("tr");
    fila.innerHTML= `
    <td>${cita.id_cita}</td>
    <td>${formatearFecha(cita.fecha_ingreso)}</td>
    <td>${cita.cliente}</td>
    <td>${cita.tipo_mantenimiento}</td>    
    <td>${formatearFecha(cita.fecha_entrega_estimada)}</td>
    <td>${cita.estado}</td>
    <td>${cita.tecnico}</td>
    <td><button class="btn btn-sm btn-primary btn-editar" data-bs-toggle="modal" data-id=${cita.id_cita} data-bs-target="#modalEditarCita">Editar</button></td>
    `;
    tablaCitas.appendChild(fila);
    
  })
  console.log(fecha, listarCitas)



        
    } catch (error) {
        console.error("Error al cargar citas:", error);
    }
    
  }


   async function cargarTodasCitas() {

    try {
         const res = await secureFetch(`${CONFIG.API_URL}/api/citas/?estado=${"pendiente"}`, {
    method: "GET",
  });
  if (!res) return;

  const listarCitas = (await res.json());
  tablaCitas = document.getElementById("tabla-citas");
  tablaCitas.innerHTML = "";
  listarCitas.forEach((cita) =>{
    const fila = document.createElement("tr");
    fila.innerHTML= `
    <td>${cita.id_cita}</td>
    <td>${formatearFecha(cita.fecha_ingreso)}</td>
    <td>${cita.cliente}</td>
    <td>${cita.tipo_mantenimiento}</td>    
    <td>${formatearFecha(cita.fecha_entrega_estimada)}</td>
    <td>${cita.estado}</td>
    <td>${cita.tecnico}</td>
    <td><button class="btn btn-sm btn-primary btn-editar" data-bs-toggle="modal" data-id=${cita.id_cita} data-bs-target="#modalEditarCita">Editar</button></td>
    `;
    tablaCitas.appendChild(fila);
    
  })
  console.log(fecha, listarCitas)



        
    } catch (error) {
        console.error("Error al cargar citas:", error);
    }
    
  }

   // ===============================
  // Filtro fecha 
  // ===============================

const filtroFecha = document.getElementById('filtroFecha').value;

// Cargar cliente para registro de cita

document.addEventListener("DOMContentLoaded", ()=>{


  document.getElementById("btn-cargar-cliente").addEventListener("click", async() =>{
    const id = document.getElementById("id-cliente").value.trim();
    
    
    if(!id) return alert("ingresa un id valido");
  
      try {
           const res = await secureFetch(`${CONFIG.API_URL}/api/usuarios/${id}`, {
      method: "GET",
    });
  
    const cliente = (await res.json());
    if (!res.ok) throw new Error(cliente.error || "No se encontró el cliente");
    console.log(cliente)
    document.getElementById("nombre-cliente").textContent = `Nombre Cliente: ${cliente.nombre}`;
    
  
          
      } catch (error) {
          console.error("Error al cargar citas:", error);
      }
  })



})





