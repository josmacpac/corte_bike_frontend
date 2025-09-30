document.addEventListener("DOMContentLoaded", () => {

 // Login
  // Login
document.getElementById("login-form").addEventListener("submit", function(event){
  event.preventDefault();
  console.log("login...");
  mostrarSpinner();

  const data = {
    email: document.getElementById("emailLogin").value,
    contrasena: document.getElementById("passwordLogin").value
  };

  fetch(`${CONFIG.API_URL}/api/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(async res => {
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.msg || "Credenciales incorrectas");
    }
    return res.json();
  })
  .then(respuesta => {
    ocultarSpinner(); // 🔹 lo ocultamos al tener la respuesta

    if (respuesta.access_token) {
      localStorage.setItem("token", respuesta.access_token);
      const payload = JSON.parse(atob(respuesta.access_token.split('.')[1]));

      // redirigir
      window.location.href = payload.rol === "admin" ? "dashboard.html" : "citas.html";
    } else {
      alert("Error: No se recibió el token");
    }
  })
  .catch(error => { 
    ocultarSpinner(); // 🔹 lo ocultamos también en errores
    alert("Error en el login: " + error.message); 
  });
});


  // Registro 
  document.getElementById("registro-form").addEventListener("submit", function(event){
    event.preventDefault();
    mostrarSpinner();
    const contrasena = document.getElementById("passwordRegister").value;
    const contrasena_conf = document.getElementById("passwordRegisterConf").value;
    const mensajeDiv = document.getElementById("mensajeRegistro");

    if(contrasena !== contrasena_conf){
      mensajeDiv.textContent = "Las contraseñas no coinciden.";
      return;
    }
    mensajeDiv.textContent = "";

    const data = {
      nombre: document.getElementById("nombreRegister").value,
      email: document.getElementById("emailRegister").value,
      domicilio: document.getElementById("domicilioRegister").value,
      telefono: document.getElementById("telefonoRegister").value,
      contrasena: contrasena
    };

    fetch(`${CONFIG.API_URL}/api/usuarios/registro_cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(async res => {
      ocultarSpinner();
      if(!res.ok){
        const errorData = await res.json();
        throw new Error(errorData.msg || "Error al registrar");
      }
      return res.json();
    })
    .then(respuesta => {
      ocultarSpinner();
      alert("¡Registro exitoso! Ya puedes iniciar sesión.");
      const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
      modal.hide();
      document.getElementById("registro-form").reset();
    })
    .catch(error => {
      ocultarSpinner();
      mensajeDiv.textContent = error.message;
    });
  });



  // Ejemplo de eventos
  const eventos = [
    { titulo: "Ruta MTB en montaña", fecha: "10 Septiembre", descripcion: "Un recorrido para todos los niveles." },
    { titulo: "Taller de mecánica básica", fecha: "17 Septiembre", descripcion: "Aprende a mantener tu bici como un profesional." },
    { titulo: "Paseo urbano nocturno", fecha: "24 Septiembre", descripcion: "Disfruta de la ciudad en bici al atardecer." }
  ];

  const carouselInner = document.getElementById("carousel-inner-eventos");

  eventos.forEach((evento, index) => {
    const div = document.createElement("div");
    div.className = "carousel-item" + (index === 0 ? " active" : "");
    div.innerHTML = `
      <h5>${evento.titulo}</h5>
      <small>${evento.fecha}</small>
      <p>${evento.descripcion}</p>
    `;
    carouselInner.appendChild(div);
  });







});
