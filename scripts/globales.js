// Funciones Globales

async function secureFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(url, options);
    if (res.status === 401) {
      mostrarMensajeExpirado();
      return null;
    }
    return res;
  } catch (error) {
    console.error("Error de red en secureFetch:", error);
    mostrarMensajeExpirado();
    return null;
  }
}

function mostrarMensajeExpirado() {
  alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
  localStorage.removeItem("token");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 2000);
}

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-MX', { 
        year: '2-digit', 
        month: '2-digit', 
        day: '2-digit'
    }) + ' ' + fecha.toLocaleTimeString('es-MX', {
        hour: '2-digit', 
        minute: '2-digit'
    });
}

async function usuarioActual() {
  
  try{
        const res = await secureFetch(`${CONFIG.API_URL}/api/usuarios/perfil`, {
          method: "GET",
        });
        if (!res) return;

          if (!res.ok) {
      // Maneja errores HTTP, por ejemplo token expirado o no autorizado
      console.error("Error en la respuesta del servidor:", res.status);
      return;
    }
        const usuario = await res.json();
        const spanusuario = document.getElementById("usuario-actual");

         if (spanusuario && usuario.nombre) {
      spanusuario.textContent = usuario.nombre;
    } else {
      console.warn("Elemento para mostrar usuario no encontrado o nombre inválido.");
    }
      

      }catch(error){
        console.error("Error al procesar usuarios:", error);
      }
  

}

//recargar pagina
  function recargarPagina(){
    location.reload();
  }

 // ===============================
  // Obtener horarios disponibles
  // ===============================
  async function horariosDisponibles() {
    const inputFecha = document.getElementById("fecha-cita");
    const selectorHorarios = document.getElementById("horas-disponibles");

    inputFecha.addEventListener("change", async () => {
      const fecha = inputFecha.value;
      if (!fecha) return;

      try {
        const res = await secureFetch(`${CONFIG.API_URL}/api/citas/horarios_disponibles?fecha=${fecha}`, {
          method: "GET",
        });
        if (!res || !res.ok) return;

        const listaHorarios = (await res.json()).disponibles;

        // ===============================
      // Filtrar horas cercanas si es hoy
      // ===============================
      

        selectorHorarios.innerHTML = '<option value="">Selecciona una hora</option>';

        if (listaHorarios.length === 0) {
          const option = document.createElement("option");
          option.value = "";
          option.textContent = "No hay horarios disponibles";
          selectorHorarios.appendChild(option);
          return;
        }

        listaHorarios.forEach((horario) => {
          const option = document.createElement("option");
          option.value = horario;
          option.textContent = horario;
          selectorHorarios.appendChild(option);
        });
      } catch (error) {
        console.error("Error al cargar horarios:", error);
      }
    });
  }

  //Establecer fecha minima para registrar cita 

function fechaMinima(){

  const inputFecha = document.getElementById("fecha-cita");
  
      const hoy = new Date();
      const yyyy = hoy.getFullYear();
      const mm = String(hoy.getMonth() + 1).padStart(2, '0');
      const dd = String(hoy.getDate()).padStart(2, '0');
  
      inputFecha.min = `${yyyy}-${mm}-${dd}`;
} 
