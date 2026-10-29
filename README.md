# Lila del Alba · E-commerce

Tienda online hecha con React, React Router y Firebase (Cloud Firestore + Authentication), lista para publicar en Vercel.
Los productos, precios, fotos y colores salen de las listas de la marca (PDF).

## Qué incluye

- Catálogo desde Firestore, filtro por categoría, búsqueda y orden por precio.
- Detalle de producto con opciones (fragancia, tipo, color), control de stock y precio "x10 U.".
- Carrito con `CartContext`: agregar, eliminar, vaciar, unidades y total. Se conserva al recargar.
- Registro, inicio y cierre de sesión con `AuthContext` (la sesión se mantiene al recargar).
- Checkout con renderizado condicional: sin sesión muestra el acceso, con sesión muestra el formulario.
- Orden guardada en la colección `orders` con el ID de confirmación. El carrito se vacía solo si se guardó bien.
- Estados de carga y mensajes de error en catálogo, detalle, registro, login y checkout.

## Rutas

| Ruta | Vista |
| --- | --- |
| `/` | Catálogo general |
| `/category/:categoryId` | Catálogo por categoría (`hogar`, `jabones`, `cremas`, `aceites`, `serum`, `balsamo`, `ducha`) |
| `/item/:id` | Detalle de producto |
| `/cart` | Carrito |
| `/login` · `/register` | Acceso y registro |
| `/checkout` | Compra (cambia según haya sesión o no) |

`vercel.json` redirige todas las rutas a `index.html`, así que funcionan al recargar el navegador.

## Puesta en marcha

1. **Firebase**: en [console.firebase.google.com](https://console.firebase.google.com) creá un proyecto y agregá una app web (`</>`). Copiá su configuración.
2. **Variables**: copiá `.env.example` como `.env` y completá los valores `VITE_FIREBASE_*`.
3. **Firestore**: en *Build > Firestore Database* creá la base en modo de prueba.
4. **Authentication**: en *Build > Authentication > Sign-in method* habilitá *Correo electrónico/contraseña*.
5. **Instalar y cargar el catálogo**:
   ```bash
   npm install
   npm run seed
   ```
   `npm run seed` crea los 23 productos en la colección `products` (si lo corrés de nuevo, los actualiza).
6. **Reglas**: en *Firestore > Reglas* pegá el contenido de `firestore.rules` y publicá. Así el catálogo es de solo lectura y cada usuario ve solo sus órdenes.
7. **Probar en tu computadora**: `npm run dev`.
8. **Revisar antes de desplegar**: `npm run build`.

## Despliegue en Vercel

1. Subí el proyecto a GitHub (el archivo `.env` no se sube: está en `.gitignore`).
2. En Vercel: *Add New > Project* e importá el repositorio. Detecta Vite automáticamente.
3. En *Environment Variables* cargá las seis variables `VITE_FIREBASE_*` con los mismos valores del `.env`.
4. Desplegá y abrí la URL pública.
5. En Firebase, *Authentication > Settings > Authorized domains*, agregá el dominio de Vercel (por ejemplo `mi-tienda.vercel.app`). Sin este paso el registro y el login fallan en producción.

## Verificación final (desde la URL de Vercel)

- [ ] La página inicial carga y los productos vienen de Firestore.
- [ ] El filtro por categoría funciona y las rutas internas funcionan al recargar.
- [ ] Cada producto tiene detalle y no deja elegir más unidades que el stock.
- [ ] El carrito muestra productos, unidades y total; permite eliminar y vaciar.
- [ ] Registro, login, sesión al recargar y logout funcionan.
- [ ] `/checkout` sin sesión muestra el acceso; al ingresar aparece el formulario con el carrito intacto.
- [ ] Al confirmar se crea la orden en `orders`, se muestra el ID y el carrito queda vacío.
- [ ] Se ve bien en el celular y no hay errores en la consola.

## Datos que conviene revisar

- **Stock**: los valores son de ejemplo (las listas no lo indican). Editá el campo `stock` en Firestore o en `scripts/products.mjs`.
- **Fotos**: salen de los PDF y se reutilizan por categoría (`public/img`). Para fotos propias de cada producto, reemplazá el archivo y el campo `image` del producto. Bálsamo labial usa la foto del sérum porque la lista no trae una propia.
- **Fragancias por producto**: están tomadas de los íconos de la lista de fragancias (por ejemplo, Açaí solo en body splash y crema).
- **Precio "x10 U."**: se aplica cuando el carrito suma 10 o más unidades del mismo producto, aunque tengan fragancias distintas.
- **Instagram**: el enlace del pie de página usa `@liladelalba`, que se lee en las etiquetas de las fotos. Confirmá que sea el correcto.

## Sobre `npm audit`

`npm audit` informa 4 avisos altos que vienen de `@grpc/grpc-js`, una dependencia interna de Firebase para servidores (gRPC). El navegador no la usa. No ejecutes `npm audit fix --force`: baja Firebase a una versión muy vieja y rompe el proyecto.
