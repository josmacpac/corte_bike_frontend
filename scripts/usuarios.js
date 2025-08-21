// ===============================
// Manejadores principales
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("token")) {
    alert("Acceso no autorizado. Inicia sesión.");
    window.location.href = "index.html";
    return;
  }

  cargarUsuarios();
  registrarEventos();
  usuarioActual();
});

// ===============================
// Cargar y mostrar usuarios
// ===============================

async function cargarUsuarios() {
  const res = await secureFetch(`${CONFIG.API_URL}/api/usuarios/ver_usuarios`, {
    method: "GET",
  });
  if (!res) return;

  try {
    const usuarios = await res.json();
    const tbody = document.getElementById("usuarios-body");
    tbody.innerHTML = "";
    usuarios.forEach((usuario) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${usuario.id}</td>
        <td>${usuario.nombre}</td>
        <td>${usuario.email}</td>
        <td>${usuario.rol}</td>
        <td>
          <button class="btn btn-sm btn-primary btn-editar" data-id="${usuario.id}" data-bs-toggle="modal" data-bs-target="#modalEditarUsuario">Editar</button>
          <button class="btn btn-sm btn-danger btn-eliminar" data-id="${usuario.id}" >Eliminar</button>
        </td>`;
      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al procesar usuarios:", error);
  }
}

// ===============================
// Eventos y formularios
// ===============================

function registrarEventos() {
  const tabla = document.getElementById("tablaUsuarios");
  let id_actual = "";

  tabla.addEventListener("click", function (e) {
    if (e.target.classList.contains("btn-editar")) {
      id_actual = e.target.dataset.id;
      consultarInfoUsuario(id_actual);
    }
    if (e.target.classList.contains("btn-eliminar")){
      id_actual = e.target.dataset.id;
      eliminarUsuario(id_actual)
    }
  });

  document.getElementById("buscadorUsuarios").addEventListener("input", filtrarUsuarios);
  document.getElementById("form-nuevo-usuario").addEventListener("submit", (e) => registrarUsuario(e));
  document.getElementById("form-editar-usuario").addEventListener("submit", (e) => editarUsuario(e, id_actual));
}

function filtrarUsuarios() {
  const filtro = this.value.toLowerCase();
  const filas = document.querySelectorAll("table tbody tr");

  filas.forEach((fila) => {
    const folio = fila.cells[0].textContent.toLowerCase();
    const cliente = fila.cells[2].textContent.toLowerCase();
    fila.style.display = folio.includes(filtro) || cliente.includes(filtro) ? "" : "none";
  });
}

// ===============================
// Consultar usuario por ID
// ===============================

async function consultarInfoUsuario(id) {
  const res = await secureFetch(`${CONFIG.API_URL}/api/usuarios/${id}`, {
    method: "GET",
  });
  if (!res) return;

  try {
    const usuario = await res.json();
    document.getElementById("editar-nombre").value = usuario.nombre;
    document.getElementById("editar-email").value = usuario.email;
    document.getElementById("editar-domicilio").value = usuario.domicilio;
    document.getElementById("editar-telefono").value = usuario.telefono;
    document.getElementById("editar-rol").value = usuario.rol;
  } catch (error) {
    console.error("Error al cargar usuario", error);
    alert("No se pudo cargar el usuario");
  }
}

// ===============================
// Registro nuevo usuario
// ===============================

function registrarUsuario(event) {
  event.preventDefault();
  const token = localStorage.getItem("token");
  if (!token) return mostrarMensajeExpirado();

  const contrasena = document.getElementById("contrasena").value;
  const contrasena_conf = document.getElementById("contrasena_conf").value;
  const mensajeDiv = document.getElementById("mensaje-nuevo");
  const mensajeExito = document.getElementById("mensaje-exito-nuevo");

  if (contrasena !== contrasena_conf) {
    mensajeDiv.textContent = "Las contraseñas no coinciden.";
    mensajeDiv.classList.remove("d-none");
    return;
  }
  mensajeDiv.classList.add("d-none");

  const data = {
    nombre: document.getElementById("nombre").value,
    email: document.getElementById("email").value,
    domicilio: document.getElementById("domicilio").value,
    telefono: document.getElementById("telefono").value,
    contrasena,
    rol: document.getElementById("rol").value,
  };

  fetch(`${CONFIG.API_URL}/api/usuarios/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
.then(async (res) => {
  const respuesta = await res.json();

  if (!res.ok) {
    throw new Error(respuesta.error || "Error al registrar usuario");
  }

  mensajeExito.textContent = "¡Usuario registrado exitosamente!";
  mensajeExito.classList.remove("d-none");
  document.getElementById("form-nuevo-usuario").reset();
  mensajeDiv.classList.add("d-none");
  setTimeout(() => {
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalNuevoUsuario"));
    if (modal) modal.hide();
    mensajeExito.classList.add("d-none");
    cargarUsuarios();
  }, 2000);
})
.catch((error) => {
  console.error("Error en el registro:", error);
  mensajeDiv.textContent = error.message || "Ocurrió un error al registrar. Intenta de nuevo.";
  mensajeDiv.classList.remove("d-none");
});

}

// ===============================
// Editar usuario
// ===============================

async function editarUsuario(event, id_actual) {
  event.preventDefault();
  if (!id_actual) return;

  const token = localStorage.getItem("token");
  if (!token) return mostrarMensajeExpirado();

  const contrasena = document.getElementById("editar-contrasena").value;
  const contrasena_conf = document.getElementById("editar-contrasena_conf").value;
  const mensajeDiv = document.getElementById("mensaje-editar");
  const mensajeExito = document.getElementById("mensaje-exito-editar");

  const data = {
    nombre: document.getElementById("editar-nombre").value,
    email: document.getElementById("editar-email").value,
    domicilio: document.getElementById("editar-domicilio").value,
    telefono: document.getElementById("editar-telefono").value,
    rol: document.getElementById("editar-rol").value,
  };

  if (contrasena || contrasena_conf) {
    if (contrasena !== contrasena_conf) {
      mensajeDiv.textContent = "Las contraseñas no coinciden.";
      mensajeDiv.classList.remove("d-none");
      return;
    }
    data.contrasena = contrasena;
  }
  mensajeDiv.classList.add("d-none");

  try {
    const res = await fetch(`${CONFIG.API_URL}/api/usuarios/mod_usuario/${id_actual}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const resultado = await res.json();
    if (!res.ok) throw new Error(resultado.error || "Error al actualizar");

    mensajeExito.textContent = "¡Usuario actualizado exitosamente!";
    mensajeExito.classList.remove("d-none");
    document.getElementById("form-editar-usuario").reset();

    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditarUsuario"));
      if (modal) modal.hide();
      mensajeExito.classList.add("d-none");
      cargarUsuarios();
    }, 2000);
  } catch (error) {
    console.error("Error en la actualización:", error);
    mensajeDiv.textContent = error.message || "Ocurrió un error al actualizar.";
    mensajeDiv.classList.remove("d-none");
  }
}

// ===============================
// Eliminar usuario
// ===============================

async function eliminarUsuario(id_actual){

if (!id_actual) return;

  const token = localStorage.getItem("token");
  if (!token) return mostrarMensajeExpirado();

  const mensajeDiv = document.getElementById("mensaje-eliminar");
  const mensajeExito = document.getElementById("mensaje-exito-eliminar");

  try {
    const res = await fetch(`${CONFIG.API_URL}/api/usuarios/eliminar_usuario/${id_actual}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    });

    const resultado = await res.json();
    if (!res.ok) throw new Error(resultado.error || "Error al Eliminar usuario");

    mensajeExito.textContent = "¡Usuario eliminado exitosamente!";
    mensajeExito.classList.remove("d-none");
    setTimeout(() => {
  location.reload();
}, 1500);
    
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    mensajeDiv.textContent = error.message || "Ocurrió un error al eliminar usuario.";
    mensajeDiv.classList.remove("d-none");
  }
}