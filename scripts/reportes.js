document.getElementById("formReporte").addEventListener("submit", function(e){
      e.preventDefault();

      const tipo = document.querySelector("input[name='tipoReporte']:checked");
      const inicio = document.getElementById("fechaInicio").value;
      const fin = document.getElementById("fechaFin").value;

      if(!tipo || !inicio || !fin){
        alert("Por favor selecciona el tipo de reporte y el rango de fechas.");
        return;
      }

      // Simulación de reporte
      const resultado = document.getElementById("resultadoReporte");
      resultado.innerHTML = `
        <div class="card-header">${tipo.value.toUpperCase().replace("_"," ")} (${inicio} a ${fin})</div>
        <div class="card-body">
          <table class="table table-striped table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Juan Pérez</td>
                <td>Básico</td>
                <td>${inicio}</td>
                <td>Completado</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Ana López</td>
                <td>Premier</td>
                <td>${fin}</td>
                <td>Pendiente</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      // Mostrar botón de descarga
      document.getElementById("btnDescargar").classList.remove("d-none");
    });

    // Evento del botón Descargar
    document.getElementById("btnDescargar").addEventListener("click", function(){
      alert("Aquí iría la lógica para descargar el reporte en Excel o PDF 🚀");
    });