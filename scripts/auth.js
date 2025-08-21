// auth.js

function obtenerToken() {
  return localStorage.getItem("token");
}

function decodificarToken(token) {
  try {
    const payloadBase64 = token.split('.')[1];
    return JSON.parse(atob(payloadBase64));
  } catch (error) {
    return null;
  }
}

function verificarAcceso(rolesPermitidos = []) {
  const token = obtenerToken();
  if (!token) {
    alert("Acceso denegado. Inicia sesión.");
    window.location.href = "index.html";
    return;
  }

  const payload = decodificarToken(token);
  if (!payload || !rolesPermitidos.includes(payload.rol)) {
    alert("No tienes permiso para acceder a esta página.");
    window.location.href = "index.html";  // o página general
  }
}
