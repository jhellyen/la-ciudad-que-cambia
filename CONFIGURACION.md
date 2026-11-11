# La ciudad que cambia · versión por equipos

## Configuración inicial
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/). Registra una aplicación web y copia el objeto de configuración público en `firebase-config.js`. No uses una clave de cuenta de servicio.
2. En Authentication, habilita Correo electrónico/contraseña y Anónimo. Crea la cuenta docente en Usuarios. Copia su UID en `firestore.rules` donde figura REEMPLAZAR_UID_DOCENTE.
3. Crea Cloud Firestore. Pega y publica las reglas del archivo `firestore.rules` desde Firestore → Reglas.
4. Crea el repositorio en GitHub y sube estos archivos a su raíz. En Settings → Pages, elige Deploy from a branch → main → / (root). Añade el dominio de Pages en Authentication → Settings → Authorized domains.
5. Abre la página en HTTPS, inicia sesión como docente y crea una sesión. Guarda su identificador para reabrirla. Comparte un enlace distinto con cada portavoz.

## Prueba antes de usarla
Abre el panel docente y usa un perfil separado del navegador para cada equipo. Revela un imprevisto, escribe una respuesta desde un equipo y comprueba que aparece en el panel. Recarga el navegador del equipo y verifica el mapa y el parte. Prueba que otro perfil con el mismo enlace no pueda tomar el control mientras el portavoz está asignado.

## En clase
El panel controla las fases y revela las tarjetas. Cada portavoz edita el mapa y escribe debajo de cada imprevisto. El panel muestra los mapas, respuestas, sobres y parte. Si se pierde el acceso al navegador del portavoz, libera su acceso desde el panel y vuelve a compartir el enlace. Usa enlaces privados y nombres de equipo sin datos personales.


## Uso con salas de Zoom
Crea en Zoom una sala por equipo y envía su enlace al portavoz. Mantén el panel en una pestaña aparte. Cada ventana del panel muestra el progreso que llega desde Firebase, no la pantalla ni el audio de Zoom. En la ventana del equipo, selecciona el imprevisto, marca Revisar, Correcto o Pregunta y envía tu comentario. Lo verán debajo de su respuesta. Las pistas desplegables están disponibles durante la actividad.
Cada reto vale hasta 3 puntos. La docente puede enviar una reacción, un comentario o una nota. Una revisión sustituye la nota del reto. El parte general admite feedback sin puntuación.
