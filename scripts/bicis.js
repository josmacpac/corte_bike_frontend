document.addEventListener("DOMContentLoaded", () => {

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

  const form = document.getElementById("form-nueva-bici");
  const listaBicis = document.getElementById("listaBicis");

  if (form) form.addEventListener("submit", registrarBici);

  // ===============================
  // Registrar nueva bici
  // ===============================
  async function registrarBici(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return mostrarMensajeExpirado();

    const data = {
      idUsuario: obtenerIdToken(token),
      marca: document.getElementById("marca").value,
      modelo: document.getElementById("modelo").value,
      tipo: document.getElementById("tipo").value,
      talla: document.getElementById("talla").value,
      rodada: document.getElementById("rodada").value,
      serie: document.getElementById("noSerie").value,
      color: document.getElementById("color").value,
    };

    try {
      const res = await secureFetch(`${CONFIG.API_URL}/api/bicis/`, {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res) return;

      const resultado = await res.json();
      if (!res.ok) throw new Error(resultado.error || "Error al registrar bici");

      //crearCardsBicis(resultado); // Crear card con la bici recién registrada
      cargarBicis()
      form.reset();

    } catch (error) {
      console.error("Error al registrar bici:", error);
      alert("Ocurrió un error al registrar la bici. Revisa la consola.");
    }
  }

  // ===============================
  // Cargar bicis existentes
  // ===============================
async function cargarBicis() {
  const token = localStorage.getItem("token");
  if (!token) return mostrarMensajeExpirado();

  try {
    const res = await secureFetch(`${CONFIG.API_URL}/api/bicis/mis_bicis`, { method: "GET" });
    if (!res) throw new Error("No se pudo cargar las bicis");

    const bicis = await res.json();
    listaBicis.innerHTML = ""; // Limpia contenedor

    if (bicis.length === 0) {
      // Si no hay bicis, mostrar el mensaje
      listaBicis.innerHTML = `<p>Aún no has agregado ningún registro</p>`;
      return;
    }

    // Si hay bicis, crear sus cards
    bicis.forEach((bici) => crearCardsBicis(bici));

  } catch (error) {
    console.error("Error al cargar bicis:", error);
  }
}


  // ===============================
  // Crear card de bici (para registrar o cargar)
  // ===============================
  function crearCardsBicis(bici) {
    const card = document.createElement("div");
    card.classList.add("bici-card", "card", "shadow-sm");

    card.innerHTML = `
      <div class="bici-header card-header bg-primary text-white" style="cursor:pointer;">
        ID: ${bici.bici_id} - ${bici.marca} ${bici.modelo}
      </div>
      <div class="bici-detalles card-body collapse">
        <p><b>Tipo:</b> ${bici.tipo}</p>
        <p><b>Talla:</b> ${bici.talla}</p>
        <p><b>Rodada:</b> ${bici.rodada}</p>
        <p><b>Color:</b> ${bici.color}</p>
        <p><b>No. Serie:</b> ${bici.serie}</p>
        <button class="btn btn-sm btn-outline-primary btn-ver-mantenimientos" data-id="${bici.bici_id}" data-bs-toggle="modal"  data-bs-target="#modalMantenimientos" >Ver mantenimientos</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar-bici" data-id="${bici.bici_id}" >Eliminar</button>
        <button class="btn btn-sm btn-outline-secondary" data-id="${bici.bici_id}" data-bs-toggle="modal" data-bs-target="#modalEditarBici" >Editar</button>
        
      </div>
    `;

    const detalles = card.querySelector(".bici-detalles");
    const header = card.querySelector(".bici-header");

    // Toggle suave con altura automática
    header.addEventListener("click", () => {
      if (detalles.classList.contains("show")) {
        detalles.style.height = detalles.scrollHeight + "px"; // fuerza altura inicial
        requestAnimationFrame(() => {
          detalles.style.height = "0";
        });
        detalles.addEventListener("transitionend", () => detalles.classList.remove("show"), { once: true });
      } else {
        detalles.classList.add("show");
        detalles.style.height = "0";
        requestAnimationFrame(() => {
          detalles.style.height = detalles.scrollHeight + "px";
        });
        detalles.addEventListener("transitionend", () => detalles.style.height = "auto", { once: true });
      }
    });

    listaBicis.prepend(card);
  }

  cargarBicis(); // Ejecutar al cargar la página



 // ===============================
  // cargar mantenimientos
  // ===============================

  

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-ver-mantenimientos");
  if (btn) {
    const biciId = btn.dataset.id;
    console.log("ID de la bici a consultar:", biciId);
    cargarMantenimientosBici(biciId);
  }
});

  async function cargarMantenimientosBici(id_bici) {
    const token = localStorage.getItem("token");
  if (!token) return mostrarMensajeExpirado();
  
  try {
    const tablaMantenimientos = document.getElementById('tablaMantenimientos')
    const res = await secureFetch(`${CONFIG.API_URL}/api/bicis/mantenimiento/${id_bici}`, { method: "GET" });
    if (!res) throw new Error("No se pudo cargar la información");

    const mantenimientos = await res.json();
    console.log(mantenimientos)
    tablaMantenimientos.innerHTML = ""; // Limpia contenedor

    if (mantenimientos.length === 0) {
      // Si no hay bicis, mostrar el mensaje
      tablaMantenimientos.innerHTML = `<tr>
          <td colspan="5" class="text-center">Aún no has agregado ningún mantenimiento</td>
        </tr>`;
      return;
    }

    // Si hay bicis, crear cargar datos en tabla 
    mantenimientos.forEach(m => {
      const fila = document.createElement("tr");
      fila.innerHTML= `
      <td>${m.id_cita}</td>
        <td>${m.tipo}</td>
        <td>${m.fecha}</td>
        <td>${m.estado}</td>
        <td>${m.descripcion}</td>
        `;

        tablaMantenimientos.appendChild(fila);
    });
    

  } catch (error) {
    console.error("Error al cargar los mantenimientos:", error);
  }

    
  }
  });

  //Eliminar bici

  document.addEventListener("click", (e) => {
  const btnEliminar = e.target.closest(".btn-eliminar-bici");
  if (btnEliminar) {
    const biciId = btnEliminar.dataset.id;
    console.log("ID de la bici a eliminar:", biciId);
    eliminarBici(biciId);
  }

  async function eliminarBici(bici_id) {
    const token = localStorage.getItem("token");
  if (!token) return mostrarMensajeExpirado();

  try {
     const res = await fetch(`${CONFIG.API_URL}/api/bicis/eliminar/${bici_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    });

    const resultado = await res.json();
    if (!res.ok) throw new Error(resultado.error || "Error al Eliminar Bici");
 setTimeout(() => {
  location.reload();
}, 1500);
    
  } catch (error) {
    console.error("Error al eliminar Bici:", error);
  }


  }
});
