

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

  cargarCitasTabla(hoy);  //cargar citas con la fecha actual 
  fechaMinima();
  horariosDisponibles();
  
});


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
    <td><button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-id=${cita.id_cita} data-bs-target="#modalEditarCita">Editar</button></td>
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



