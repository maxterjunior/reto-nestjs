export const lateArrivalEmailTemplate = (data: {
  employeeName: string;
  scheduledTime: string;
  actualTime: string;
  minutesLate: number;
  date: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #f44336;
          color: white;
          padding: 15px;
          border-radius: 5px 5px 0 0;
          text-align: center;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .detail {
          margin: 10px 0;
          padding: 10px;
          background-color: white;
          border-left: 4px solid #f44336;
        }
        .label {
          font-weight: bold;
          color: #666;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ Alerta de Tardanza</h2>
        </div>
        <div class="content">
          <p>Se ha registrado una tardanza significativa:</p>
          
          <div class="detail">
            <span class="label">Empleado:</span> ${data.employeeName}
          </div>
          
          <div class="detail">
            <span class="label">Fecha:</span> ${data.date}
          </div>
          
          <div class="detail">
            <span class="label">Hora esperada:</span> ${data.scheduledTime}
          </div>
          
          <div class="detail">
            <span class="label">Hora de llegada:</span> ${data.actualTime}
          </div>
          
          <div class="detail">
            <span class="label">Minutos de retraso:</span> <strong>${data.minutesLate} minutos</strong>
          </div>
          
          <p style="margin-top: 20px;">
            <strong>Nota:</strong> Esta notificación se envía cuando un empleado llega con más de 1 hora de retraso.
          </p>
        </div>
        
        <div class="footer">
          Sistema de Control de Asistencia - ${new Date().getFullYear()}
        </div>
      </div>
    </body>
    </html>
  `;
};
