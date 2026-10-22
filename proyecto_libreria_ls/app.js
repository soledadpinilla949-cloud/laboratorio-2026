// Selección de elementos con querySelector.
const contenedorProductos = document.querySelector("#contenedorProductos");
const contenedorCarrito = document.querySelector("#contenedorCarrito");
const contadorItems = document.querySelector("#contadorItems");
const totalCarrito = document.querySelector("#totalCarrito");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const cantidadResultados = document.querySelector("#cantidadResultados");
const notificacion = document.querySelector("#notificacion");
const seccionCarrito = document.querySelector("#seccionCarrito");

let carrito = JSON.parse(localStorage.getItem("carritoLS")) || [];
let favoritos = JSON.parse(localStorage.getItem("favoritosLS")) || [];
let temporizadorNotificacion;

const formatoPrecio = (valor) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(valor);

function guardarCarrito() {
  localStorage.setItem("carritoLS", JSON.stringify(carrito));
}

function avisar(mensaje) {
  notificacion.textContent = mensaje;
  notificacion.classList.add("visible");
  clearTimeout(temporizadorNotificacion);
  temporizadorNotificacion = setTimeout(() => notificacion.classList.remove("visible"), 2200);
}

// map() y template strings generan las tarjetas; no se escriben a mano en HTML.
function mostrarProductos(lista = productos) {
  cantidadResultados.textContent = `${lista.length} producto(s)`;
  contenedorProductos.innerHTML = lista.map(producto => {
    const cantidadEnCarrito = carrito.find(item => item.id === producto.id)?.cantidad || 0;
    const sinStock = producto.stock <= cantidadEnCarrito;
    const esFavorito = favoritos.includes(producto.id);
    return `
      <article class="producto">
        <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy"
             onerror="this.src='https://placehold.co/600x400?text=Producto'">
        <div class="producto-contenido">
          <span class="categoria">${producto.categoria}</span>
          <h3>${producto.nombre}</h3>
          <p class="descripcion">${producto.descripcion}</p>
          <div class="precio">${formatoPrecio(producto.precio)}</div>
          <p class="stock ${sinStock ? "agotado" : ""}">
            ${sinStock ? "Sin stock disponible" : `Stock disponible: ${producto.stock - cantidadEnCarrito}`}
          </p>
          <button class="btn btn-principal" type="button" data-accion="agregar" data-id="${producto.id}" ${sinStock ? "disabled" : ""}>
            ${sinStock ? "Sin stock" : "Agregar al carrito"}
          </button>
          <button class="btn btn-secundario" type="button" data-accion="favorito" data-id="${producto.id}" style="margin-top:8px">
            ${esFavorito ? "♥ En favoritos" : "♡ Agregar a favoritos"}
          </button>
        </div>
      </article>`;
  }).join("");
}

function mostrarCarrito() {
  if (carrito.length === 0) {
    contenedorCarrito.innerHTML = '<p class="vacio">Tu carrito está vacío. Agregá algún producto del catálogo.</p>';
  } else {
    contenedorCarrito.innerHTML = carrito.map(item => {
      const producto = productos.find(p => p.id === item.id);
      if (!producto) return "";
      return `
        <div class="item-carrito">
          <div>
            <h3>${producto.nombre}</h3>
            <p>${formatoPrecio(producto.precio)} por unidad</p>
          </div>
          <div class="controles-cantidad" aria-label="Cantidad de ${producto.nombre}">
            <button type="button" data-accion="disminuir" data-id="${producto.id}" aria-label="Disminuir">−</button>
            <strong>${item.cantidad}</strong>
            <button type="button" data-accion="aumentar" data-id="${producto.id}" aria-label="Aumentar"
              ${item.cantidad >= producto.stock ? "disabled" : ""}>+</button>
          </div>
          <strong class="subtotal">${formatoPrecio(producto.precio * item.cantidad)}</strong>
          <button class="btn-eliminar" type="button" data-accion="eliminar" data-id="${producto.id}">Eliminar</button>
        </div>`;
    }).join("");
  }

  const cantidadTotal = carrito.reduce((acumulado, item) => acumulado + item.cantidad, 0);
  const importeTotal = carrito.reduce((acumulado, item) => {
    const producto = productos.find(p => p.id === item.id);
    return acumulado + (producto ? producto.precio * item.cantidad : 0);
  }, 0);

  contadorItems.textContent = cantidadTotal;
  totalCarrito.textContent = formatoPrecio(importeTotal);
  guardarCarrito();
  mostrarProductos(filtrarProductos());
}

function agregarProducto(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;
  const itemExistente = carrito.find(item => item.id === id);

  // Si ya existe, aumenta la cantidad en lugar de duplicar la línea.
  if (itemExistente) {
    if (itemExistente.cantidad >= producto.stock) {
      avisar("No hay más unidades disponibles.");
      return;
    }
    itemExistente.cantidad++;
  } else {
    if (producto.stock < 1) {
      avisar("Este producto está agotado.");
      return;
    }
    carrito.push({ id: id, cantidad: 1 });
  }
  avisar("Producto agregado al carrito.");
  mostrarCarrito();
}

function cambiarCantidad(id, cambio) {
  const item = carrito.find(item => item.id === id);
  const producto = productos.find(p => p.id === id);
  if (!item || !producto) return;
  item.cantidad += cambio;
  if (item.cantidad <= 0) {
    carrito = carrito.filter(item => item.id !== id);
  } else if (item.cantidad > producto.stock) {
    item.cantidad = producto.stock;
    avisar("Llegaste al máximo de stock disponible.");
  }
  mostrarCarrito();
}

function filtrarProductos() {
  const texto = buscador.value.trim().toLowerCase();
  const categoria = filtroCategoria.value;
  return productos.filter(producto => {
    const coincideTexto = producto.nombre.toLowerCase().includes(texto) ||
      producto.descripcion.toLowerCase().includes(texto);
    const coincideCategoria = categoria === "todos" || producto.categoria === categoria;
    return coincideTexto && coincideCategoria;
  });
}

// Delegación de eventos: un solo listener para todos los botones del catálogo.
contenedorProductos.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  const accion = boton.dataset.accion;

  if (accion === "agregar") agregarProducto(id);
  if (accion === "favorito") {
    favoritos = favoritos.includes(id)
      ? favoritos.filter(favoritoId => favoritoId !== id)
      : [...favoritos, id];
    localStorage.setItem("favoritosLS", JSON.stringify(favoritos));
    mostrarProductos(filtrarProductos());
    avisar(favoritos.includes(id) ? "Agregado a favoritos." : "Quitado de favoritos.");
  }
});

// Delegación de eventos para las acciones del carrito.
contenedorCarrito.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  const accion = boton.dataset.accion;

  if (accion === "aumentar") cambiarCantidad(id, 1);
  if (accion === "disminuir") cambiarCantidad(id, -1);
  if (accion === "eliminar") {
    carrito = carrito.filter(item => item.id !== id);
    mostrarCarrito();
    avisar("Producto eliminado.");
  }
});

buscador.addEventListener("input", () => mostrarProductos(filtrarProductos()));
filtroCategoria.addEventListener("change", () => mostrarProductos(filtrarProductos()));

document.querySelector("#btnVaciar").addEventListener("click", () => {
  carrito = [];
  mostrarCarrito();
  avisar("Carrito vacío.");
});

document.querySelector("#btnVerCarrito").addEventListener("click", () => {
  seccionCarrito.scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#btnFinalizar").addEventListener("click", () => {
  if (carrito.length === 0) {
    avisar("Primero agregá productos al carrito.");
    return;
  }
  avisar("¡Compra de demostración finalizada!");
  carrito = [];
  mostrarCarrito();
});

document.querySelector("#btnTema").addEventListener("click", () => {
  document.body.classList.toggle("oscuro");
  const oscuroActivo = document.body.classList.contains("oscuro");
  localStorage.setItem("temaOscuroLS", oscuroActivo ? "si" : "no");
  document.querySelector("#btnTema").textContent = oscuroActivo ? "☀️ Modo claro" : "🌙 Modo oscuro";
});

// Recuperar la preferencia de tema al cargar la página.
if (localStorage.getItem("temaOscuroLS") === "si") {
  document.body.classList.add("oscuro");
  document.querySelector("#btnTema").textContent = "☀️ Modo claro";
}

mostrarProductos();
mostrarCarrito();
