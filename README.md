# Lila del Alba · E-commerce

Tienda online hecha con React, React Router y Firebase (Cloud Firestore + Authentication), lista para publicar en Vercel.
Incluye un panel de control de ventas, stock y caja para la dueña del negocio.
Los productos, precios, fotos y colores salen de las listas de la marca (PDF).

## Qué incluye

**Tienda**
- Catálogo desde Firestore, filtro por categoría, búsqueda y orden por precio.
- Detalle de producto con opciones (fragancia, tipo, color), control de stock y precio "x10 U.".
- Carrito con `CartContext`: agregar, eliminar, vaciar, unidades y total. Se conserva al recargar.
- El carrito incluye los **datos de envío** (nombre y apellido, código postal, provincia, localidad y calle) y el **método de pago** (transferencia o tarjeta de crédito, con 15% de recargo sobre los productos). Hasta completar todo, "Finalizar compra" queda deshabilitado y el subtotal y el envío se muestran con "-".
- Registro, inicio y cierre de sesión con `AuthContext` (la sesión se mantiene al recargar).
- Con sesión iniciada, "Finalizar compra" guarda la orden en `orders`, muestra su ID y abre WhatsApp con el pedido listo para enviar.
- Checkout con renderizado condicional: sin sesión, "Finalizar compra" lleva al acceso (el carrito y los datos de envío se conservan); con sesión, muestra la confirmación del pedido.
- Aclaración al pie del carrito y del checkout: "*Solo con envío a domicilio, con entrega estimada de 4 días hábiles."

- Estados de carga y mensajes de error en catálogo, detalle, registro, login y checkout.

**Panel de control** (`/admin`, solo para administradoras)
- **Ventas**: pedidos web por confirmar, ventas agrupadas por semana (`Semana 02/11/26 al 08/11/26`), pagos parciales, deudas y cobros.
- **Stock**:
  - Valor de todo el stock a costo y a precio de venta.
  - Venta fuera de la web.
  - Alta de productos con foto y un desplegable para elegir sus fragancias y si es con o sin color. Desde el mismo desplegable se puede sumar una fragancia nueva con "Agregar nueva fragancia".
  - Tabla con filtros por fragancia, categoría y estado, y un desplegable por producto con sus fragancias y colores.
  - Costo, precio y stock se editan directo en la tabla, con el campo numérico (flechitas o escribiendo). Se guardan solos, sin botones. La tabla entra completa en pantalla, sin barra de desplazamiento horizontal.
  - El lápiz de cada producto abre la edición completa: todos los datos, la foto (agregar, reemplazar o quitar) y eliminar el producto con confirmación.
- **Caja**: efectivo y cuenta, arqueo ("debería tener" vs. "tiene"), egresos por destino y movimientos.

## Cómo se conectan la tienda y el panel

1. Un cliente compra: se crea una orden **pendiente** en `orders` y se abre WhatsApp con el detalle y los datos de entrega.
2. En el panel, **Ventas > Pedidos web por confirmar**, la dueña revisa el pedido y toca **Confirmar venta**. Ahí se descuenta el stock, se registra una venta por producto y el cobro entra en la caja.
3. Todo cambio de stock o precio hecho en el panel se ve en la tienda al instante, porque ambos leen los mismos productos de Firestore.

El stock se descuenta al confirmar y no al comprar, porque el pago y la entrega se coordinan por WhatsApp. En la tabla de Stock, la columna Estado muestra cuántas unidades tienen pedidos web pendientes.

## Pago y envío

| Zona | Provincias | Envío (Andreani) |
| --- | --- | --- |
| NOA | Catamarca, Jujuy, La Rioja, Salta, Santiago del Estero, Tucumán | $ 10.500 |
| Centro | Buenos Aires (incluye GBA), CABA, Chaco, Córdoba, Corrientes, Entre Ríos, Formosa, La Pampa, Mendoza, Misiones, San Juan, San Luis, Santa Fe | $ 13.000 |
| Patagonia y destinos lejanos | Chubut, Neuquén, Río Negro, Santa Cruz, Tierra del Fuego | $ 17.500 |

- **Subtotal** (en el carrito) = productos + recargo de tarjeta, que es el 15% solo sobre los productos. **Total** = subtotal + envío.
- El selector de provincias lista las 23 provincias y CABA en orden alfabético, sin precios ni zonas. La zona solo agrupa las provincias con la misma tarifa y no se muestra a la clienta.
- Para cambiar un precio o mover una provincia de zona, editá `src/data/checkout.js`.
- **El código postal debe coincidir con la provincia elegida**: si no, aparece un aviso y "Finalizar compra" queda deshabilitado. Acepta el código de 4 números (`4000`), con letra (`T4000`) o el CPA completo (`T4000ABC`); la letra, si se escribe, también tiene que ser la de la provincia.
- El método de pago siempre arranca en "Selecciona una opción": no se guarda entre visitas.
- En el panel, al confirmar un pedido web el cobro se reparte primero entre los productos (con su recargo) y al final el envío, que aparece como una línea más en Ventas.

## WhatsApp

El mensaje se arma con los productos del carrito, el método de pago, el recargo (si corresponde), el costo de envío, el total y los datos de entrega (nombre, email de la cuenta, dirección, localidad, provincia y código postal), y se abre con un enlace `wa.me` al número configurado en `src/config.js`.
La clienta tiene que tocar **Enviar** en WhatsApp: una página web no puede enviar mensajes sola. Si el navegador bloquea la ventana, en la confirmación queda el botón **Enviar pedido por WhatsApp**.
Si WhatsApp dice que el número no es válido, probá en `src/config.js` con `5493815686010` (con el 9 después del 54).

## Rutas

| Ruta | Vista |
| --- | --- |
| `/` | Catálogo general |
| `/category/:categoryId` | Catálogo por categoría (`hogar`, `jabones`, `cremas`, `aceites`, `serum`, `balsamo`, `ducha`) |
| `/item/:id` | Detalle de producto |
| `/cart` | Carrito |
| `/login` · `/register` | Acceso y registro |
| `/checkout` | Compra (cambia según haya sesión o no) |
| `/admin/ventas` · `/admin/stock` · `/admin/caja` | Panel de control (solo administradoras). La barra superior no muestra las categorías de la tienda |

`vercel.json` redirige todas las rutas a `index.html`, así que funcionan al recargar el navegador.

## Puesta en marcha

1. **Firebase**: en [console.firebase.google.com](https://console.firebase.google.com) creá un proyecto y agregá una app web (`</>`). Copiá su configuración.
2. **Variables**: copiá `.env.example` como `.env` y completá los valores `VITE_FIREBASE_*`.
3. **Firestore**: en *Build > Firestore Database* creá la base en modo de prueba.
4. **Authentication**: en *Build > Authentication > Sign-in method* habilitá *Correo electrónico/contraseña*.
5. **Cuenta de administradora** (la contraseña no se escribe en ningún archivo del proyecto):
   - En *Authentication > Users > Add user* creá la cuenta con `eliana.monteros.8141@gmail.com` y la contraseña que elijas.
   - Copiá el **User UID** de esa cuenta.
   - En *Firestore Database* creá la colección `admins` con un documento cuyo **ID sea ese UID** y un campo `role` (string) con el valor `admin`.
6. **Reglas**: en *Firestore > Reglas* pegá el contenido de `firestore.rules` y publicá. Así el catálogo y el control interno solo los modifica la administradora, y cada clienta ve solo sus órdenes.
7. **Instalar y probar**:
   ```bash
   npm install
   npm run dev
   ```
8. Ingresá con el mail de administradora: entrás directo al panel. En **Stock** tocá **Cargar el catálogo inicial** para crear los 23 productos de las listas de precios.
9. **Revisar antes de desplegar**: `npm run build`.

## Despliegue en Vercel

1. Subí el proyecto a GitHub (el archivo `.env` no se sube: está en `.gitignore`).
2. En Vercel: *Add New > Project* e importá el repositorio. Detecta Vite automáticamente.
3. En *Environment Variables* cargá las seis variables `VITE_FIREBASE_*` con los mismos valores del `.env`.
4. Desplegá y abrí la URL pública.
5. En Firebase, *Authentication > Settings > Authorized domains*, agregá el dominio de Vercel (por ejemplo `mi-tienda.vercel.app`). Sin este paso el registro y el login fallan en producción.

## Verificación final (desde la URL de Vercel)

**Tienda**
- [ ] La página inicial carga y los productos vienen de Firestore.
- [ ] El filtro por categoría funciona y las rutas internas funcionan al recargar.
- [ ] Cada producto tiene detalle y no deja elegir más unidades que el stock.
- [ ] El carrito muestra productos, unidades y total; permite eliminar y vaciar.
- [ ] "Finalizar compra" queda deshabilitado hasta completar los datos de envío y elegir el método de pago; el envío y el recargo del 15% se calculan bien.
- [ ] Un código postal que no corresponde a la provincia muestra el aviso y bloquea la compra.
- [ ] Registro, login, sesión al recargar y logout funcionan.
- [ ] Sin sesión, "Finalizar compra" muestra el acceso; al ingresar aparece la confirmación con el carrito y los datos intactos.
- [ ] Con sesión iniciada, al finalizar se crea la orden en `orders`, se muestra el ID, se abre WhatsApp con todo el detalle y el carrito queda vacío.
- [ ] Se ve bien en el celular y no hay errores en la consola.

**Panel**
- [ ] Con el mail de administradora se entra a `/admin/ventas`; con otra cuenta aparece "Acceso restringido".
- [ ] El pedido de prueba aparece en "Pedidos web por confirmar" y al confirmarlo baja el stock y suma en la caja.
- [ ] Cambiar el stock o el precio en el panel se ve en la tienda.

## Datos que conviene revisar

- **Stock**: los valores iniciales son de ejemplo (las listas no lo indican). Editalos desde el panel.
- **Costos**: empiezan en $ 0; cargalos en Stock para que el valor a costo sea real.
- **Fotos**: las iniciales salen de los PDF y se reutilizan por categoría (`public/img`). Desde el panel se puede agregar, reemplazar o quitar la foto de cada producto; se achica y se guarda en Firestore. Un producto sin foto muestra el logo en la tienda. Bálsamo labial usa la foto del sérum porque la lista no trae una propia.
- **Fragancias y colores**: lo que se elige en el desplegable es lo que la clienta puede elegir en la tienda. Las fragancias nuevas se guardan en Firestore (`settings/fragrances`) y quedan disponibles en todo el panel; todavía no se pueden borrar desde el panel (se quitan editando ese documento en la consola de Firebase). Opciones que el desplegable no maneja (la arcilla de los jabones y el tipo de cabello del shampoo) se conservan al editar.
- **Productos ya cargados**: siguen funcionando. Los datos de lote que tuvieran se ignoran.
- **Fragancias por producto**: están tomadas de los íconos de la lista de fragancias (por ejemplo, Açaí solo en body splash y crema).
- **Validación del código postal**: usa rangos numéricos por provincia (`src/data/postalCodes.js`), no la base completa del Correo. Detecta errores claros (4000 con Mendoza), pero en localidades de frontera algún código podría no coincidir. Si una clienta real queda bloqueada, ampliá el rango de su provincia en ese archivo.
- **Buenos Aires**: quedó en la zona Centro, donde estaba GBA. Si el interior de la provincia tiene otra tarifa, hay que ajustarlo.
- **Precio "x10 U."**: se aplica cuando se suman 10 o más unidades del mismo producto, aunque tengan fragancias distintas.
- **Destinos de egresos**: Reinversión, Gastos del negocio y Retiro personal. Se cambian en `src/data/admin.js`.
- **Semanas**: van de lunes a domingo.
- **Datos del cliente**: el pedido guarda el email de la cuenta; no se pide teléfono ni notas, porque la clienta escribe desde su propio WhatsApp.
- **Instagram**: el enlace del pie de página usa `@liladelalba`, que se lee en las etiquetas de las fotos. Confirmá que sea el correcto.

## Sobre `npm audit`

`npm audit` informa 4 avisos altos que vienen de `@grpc/grpc-js`, una dependencia interna de Firebase para servidores (gRPC). El navegador no la usa. No ejecutes `npm audit fix --force`: baja Firebase a una versión muy vieja y rompe el proyecto.
