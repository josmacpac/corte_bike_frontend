// Funciones Globales



// ===============================
  // Decodificar token
  // ===============================


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


  let ordenAsc = true;

  function ordenarPorFecha(colIndex) {
    const tabla = document.getElementById("tablaCitas");
    const cuerpo = tabla.tBodies[0];
    const filas = Array.from(cuerpo.rows);

    filas.sort((a, b) => {
      const textoA = a.cells[colIndex].innerText.trim();
      const textoB = b.cells[colIndex].innerText.trim();

      const fechaA = convertirFechaHora(textoA);
      const fechaB = convertirFechaHora(textoB);

      return ordenAsc ? fechaA - fechaB : fechaB - fechaA;
    });

    filas.forEach(fila => cuerpo.appendChild(fila));

    ordenAsc = !ordenAsc;
  }

  // Convierte "16/08/25 02:51 p.m." a objeto Date
  function convertirFechaHora(fechaStr) {
    // Separa fecha y hora
    const [fecha, hora, ampm] = fechaStr.split(" ");

    const [dia, mes, anioCorto] = fecha.split("/");
    const [horas, minutos] = hora.split(":");

    // Año con 20xx
    const anio = 2000 + parseInt(anioCorto);

    let h = parseInt(horas, 10);
    const m = parseInt(minutos, 10);

    // Ajustar AM/PM
    if (ampm.toLowerCase().includes("p") && h < 12) {
      h += 12;
    }
    if (ampm.toLowerCase().includes("a") && h === 12) {
      h = 0; // medianoche
    }

    return new Date(anio, mes - 1, dia, h, m);
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