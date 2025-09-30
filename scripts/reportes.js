let datosReporte = [];
let nombreReporte = "";


document.addEventListener("DOMContentLoaded", () => {
  const btnDescargar = document.getElementById("btnDescargar");
  const formReporte = document.getElementById("formReporte");
  
  formReporte.addEventListener("submit", (e) => {
      e.preventDefault();
      btnDescargar.classList.remove("d-none");
      seleccionReporte(e);
  });

  btnDescargar.addEventListener("click", () => {
    if (!datosReporte || datosReporte.length === 0) {
      alert("⚠️ No hay datos para descargar.");
      return;
    }
    const fInicio = document.getElementById("fechaInicio").value;
    const fFin = document.getElementById("fechaFin").value;

   exportarReporteExcel(datosReporte, nombreReporte, fInicio, fFin);

  });

  
    


    
});




function seleccionReporte(e) {
  e.preventDefault();
  // 1. Capturar valores del formulario
  const fechaInicio = document.getElementById("fechaInicio").value;
  const fechaFin = document.getElementById("fechaFin").value;
  const tipoReporteInput = document.querySelector("input[name='tipoReporte']:checked");

  // 2. Validaciones
  if (!tipoReporteInput) {
    alert("⚠️ Debes seleccionar un tipo de reporte.");
    return;
  }
  if (!fechaInicio || !fechaFin) {
    alert("⚠️ Debes seleccionar fecha de inicio y fecha fin.");
    return;
  }

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // ignorar hora para comparar solo fecha

  if (fin < inicio) {
    alert("⚠️ La fecha final no puede ser menor que la fecha inicial.");
    return;
  }

  if (inicio > hoy || fin > hoy) {
    alert("⚠️ Las fechas no pueden ser mayores a la fecha actual.");
    return;
  }

  const tipoReporte = tipoReporteInput.value;

  // 3. Dirigir a la función correspondiente según el tipo de reporte
  switch (tipoReporte) {
    case "citas":
      generarReporteCitas(fechaInicio, fechaFin);
      break;
    case "citas_cliente":
      generarReporteCitasCliente(fechaInicio, fechaFin);
      break;
    case "tiempos":
      generarReporteTiempos(fechaInicio, fechaFin);
      break;
    case "cancelaciones":
      generarReporteCancelaciones(fechaInicio, fechaFin);
      break;
    case "citas_tipo":
      generarReporteCitasTipo(fechaInicio, fechaFin);
      break;
    default:
      console.warn("Tipo de reporte no reconocido:", tipoReporte);
  }

  
}


async function generarReporteTiempos(fechaInicio, fechaFin) {
  console.log("generando reporte de tiempos por cita ....");
  nombreReporte = " Reporte de tiempos por cita"

  try {
    mostrarSpinner();

    const url = `${CONFIG.API_URL}/api/reportes/tiempos?fecha_inicio=${fechaInicio}&fecha_final=${fechaFin}`;

    const res = await secureFetch(url, {
      method: "GET",
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const reporte = await res.json();
    console.log("📊 Respuesta del backend:", reporte);
    datosReporte = reporte;

    mostrarReporteTiempos(reporte);
    
  } catch (error) {
    console.error("❌ Error al generar reporte de tiempos:", error);
  } finally {    
    ocultarSpinner();
  }
}

function mostrarReporteTiempos(reporte) {
  const resultado = document.getElementById("resultadoReporte");

  if (!reporte || reporte.length === 0) {
    resultado.innerHTML = `<div class="card-body text-center text-muted">No se encontraron resultados.</div>`;
    return;
  }

  let filas = reporte.map(cita => `
    <tr>
      <td>${cita.id}</td>
      <td>${cita.cliente}</td>
      <td>${cita.servicio}</td>
      <td>${cita.tecnico || "-"}</td>
      <td>${cita.fecha_recibo}</td>
      <td>${cita.fecha_finalizado}</td>
      <td>${cita.tiempo_horas}</td>
    </tr>
  `).join("");

  resultado.innerHTML = `
    <div class="card-header">Tiempos por Cita</div>
    <div class="card-body">
      <table class="table table-striped table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Técnico</th>
            <th>Fecha Recibo</th>
            <th>Fecha Finalizado</th>
            <th>Tiempo (hrs)</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
    </div>
  `;
}


function exportarReporteExcel(reporte, titulo, fechaInicio, fechaFin) {
    const wb = XLSX.utils.book_new(); // 1️⃣ Crear un nuevo libro de Excel
  
    // 2️⃣ Crear los datos de la hoja
    const ws_data = [[titulo]];
    ws_data.push([`Fecha inicio: ${fechaInicio}`]);
    ws_data.push([`Fecha fin: ${fechaFin}`]);

    // Encabezados
    const encabezados = Object.keys(reporte[0] || {});
    ws_data.push(encabezados);

    // Datos
    reporte.forEach(item => {
        const fila = encabezados.map(key => item[key]);
        ws_data.push(fila);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);// 3️⃣ Crear la hoja

    // Opcional: ajustar ancho de columnas automáticamente
    const cols = encabezados.map(h => ({ wch: h.length + 5 }));
    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, "Reporte"); // 4️⃣ Agregar la hoja al libro

    XLSX.writeFile(wb, `${titulo.replace(/\s+/g, "_")}.xlsx`); // 5️⃣ Descargar archivo
}



async function generarReporteCitas(fechaInicio, fechaFin){
  console.log("Generando reporte de citas");

}