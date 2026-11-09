# TRIP Cochabamba

Código fuente del sitio, API de reservas, panel administrativo y recursos multimedia.

## Subir el código a GitHub

Crea un repositorio vacío en GitHub y extrae el ZIP. Abre una terminal en la carpeta que contiene este README y ejecuta:

```bash
git init
git add .
git commit -m "Publicar código fuente de TRIP"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

GitHub puede guardar todo el código. Para que funcionen las reservas, el login y el panel, despliega el Worker con los recursos estáticos, una base D1 y la autenticación de ChatGPT Sites. El manifiesto `.openai/hosting.json` se completa con el identificador del alojamiento al vincular el proyecto. GitHub Pages ofrece alojamiento estático y no ejecuta el Worker.

El paquete contiene fuentes y recursos. Las credenciales, la base con datos de clientes y el historial de Git se configuran o gestionan por separado.

## Mapa y reservas

- El plano contiene las 84 mesas numeradas por evento y toma como punto de partida las marcas de los flyers. El precio sigue el tarifario enviado por mensaje. El administrador debe contrastar la distribución de zonas y los cupos con el inventario de TRIP, en especial cuando el flyer y el tarifario difieren.
- **Clientes** entran por `/login.html` con su cuenta de ChatGPT y completan su perfil. Reciben un ID interno. El correo de la cuenta se guarda como destinatario al crear cada reserva. CI y fecha de nacimiento se cifran con AES-GCM usando `TRIP_PROFILE_KEY`. El cliente puede preparar el aviso por WhatsApp con su CI desde el mapa.
- **Administración** entra por `/admin` con la cuenta autorizada en `TRIP_ADMIN_EMAIL`. El panel permite editar el mapa, confirmar o liberar solicitudes, marcar reservas externas, consultar reservas por cliente y bloquear o reactivar perfiles. Se muestra solo la terminación del CI.
- **Recibos** se habilitan tras confirmación manual o pago validado. La página de estado permite descargar el plano con la mesa destacada e imprimir o guardar el recibo en PDF. Para entrega automática por correo, configura `RESEND_API_KEY` y un remitente en `TRIP_RECEIPT_FROM` con dominio verificado en Resend. La integración adjunta el plano como PNG. El panel muestra el estado del envío y permite reintentar.
- **Secretos** se configuran en el alojamiento. `TRIP_PROFILE_KEY` contiene 32 bytes codificados en hexadecimal. Conserva esa clave para poder leer los perfiles existentes. Una rotación requiere volver a cifrar los datos antes de retirar la clave anterior.
- El mapa muestra **Disponible**, **Reservada** y **Bloqueada**. Las solicitudes permanecen en el historial y dejan la mesa disponible. El administrador confirma desde **Reservas** después de verificar el pago recibido por otro medio. La primera confirmación cierra las demás solicitudes abiertas para esa mesa.
- Con el checkout activo, el cliente dispone de 10 minutos para iniciar su pago. Para evitar cobros dobles, la API emite un solo enlace de pago abierto por mesa. Aunque el mapa siga mostrando Disponible, otro cobro se rechaza hasta resolver el enlace previo. Un pago validado marca la mesa como Reservada. La conciliación compara identificador, transacción, moneda e importe.

## Desarrollo y comprobaciones

Usa Node.js 22.13 o posterior. Ejecuta `npm test` para compilar y comprobar roles, solicitudes simultáneas, confirmación única, recibos y conciliación con proveedores simulados. Para abrir la vista local, ejecuta `npm run build` y `npm run dev`, y visita `http://localhost:3000`. Esa vista usa SQLite en memoria y deja la autenticación y el checkout a cargo del alojamiento de producción. Si reutilizas una base existente, aplica las migraciones de `drizzle/` en orden, incluida `0003_requests_without_table_hold.sql`.

## Activar cobros

1. Confirma el inventario, los precios y la cuenta comercial de Libélula. Valida el contrato de integración, los medios de pago y la facturación. La integración usa `registrar` y `consultar_pagos` según el [manual del proveedor](https://libelula.bo/wp-content/uploads/2020/12/Libelula-Manual-de-Integracion-v2.7.2.pdf).
2. Guarda `LIBELULA_APPKEY` como secreto del alojamiento. Habilita `TRIP_PAYMENTS_ENABLED=true` solo cuando estén listas las pruebas con el proveedor. La base `DB` requiere las migraciones de `drizzle/`.
3. Comprueba que el dominio definitivo permite tanto el regreso del cliente como la notificación del proveedor. Un sitio privado puede bloquear el webhook externo. El retorno y la página de reserva también permiten solicitar la conciliación desde una cuenta autorizada.
4. Verifica una operación controlada antes de ofrecer pagos a clientes. Si una solicitud quedó en revisión, comprueba si el proveedor creó la deuda antes de intervenir.
