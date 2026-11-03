
// ELEMENTOS DEL HTML
const contenedorProductos = document.querySelector("#contenedor-productos");
const contenedorCarrito = document.querySelector("#contenedor-carrito");
const contenedorFavoritos = document.querySelector("#contenedor-favoritos");
const contador = document.querySelector("#contador");
const total = document.querySelector("#total");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtro-categoria");

// RECUPERAR DATOS DEL LOCAL STORAGE
let carrito = JSON.parse(localStorage.getItem("carritoLS")) || [];
let favoritos = JSON.parse(localStorage.getItem("favoritosLS")) || [];

// MOSTRAR PRODUCTOS 
function mostrarProductos(listaProductos) {
    contenedorProductos.innerHTML = listaProductos.map(producto => `
        <article class="card-producto">

            <img class="foto-producto"
             src="${producto.imagen}"
             alt="${producto.nombre}"
             onerror="this.alt='Imagen no disponible'"
            >

            <h3>${producto.nombre}</h3>
            <p>${producto.categoria}</p>

            <strong>
                $${producto.precio.toLocaleString("es-AR")}
            </strong>

            <button class="btn-agregar"
                data-accion="agregar"
                data-id="${producto.id}">
                Agregar al carrito
            </button>

            <button class="btn-favorito"
                data-accion="favorito"
                data-id="${producto.id}">
                ${favoritos.includes(producto.id) ? "❤️" : "🤍"}
                Favorito
            </button>

        </article>
    `).join("");
}

// MOSTRAR FAVORITOS

function mostrarFavoritos() {
    const productosFavoritos = productos.filter(producto =>
        favoritos.includes(producto.id)
    );

    if (productosFavoritos.length === 0) {
        contenedorFavoritos.innerHTML = `
            <p class="sin-favoritos">
                Todavía no agregaste productos a favoritos ❤️
            </p>
        `;
        return;
    }

    contenedorFavoritos.innerHTML = productosFavoritos.map(producto => `
        <article class="card-producto">
            <img
                class="foto-producto"
                src="${producto.imagen}"
                alt="${producto.nombre}"
                onerror="this.style.display='none'"
            >

            <h3>${producto.nombre}</h3>
            <p>${producto.categoria}</p>
            <strong>$${producto.precio.toLocaleString("es-AR")}</strong>

            <button
                class="btn-favorito"
                data-accion="favorito"
                data-id="${producto.id}">
                ❤️ Quitar de favoritos
            </button>
        </article>
    `).join("");
}


// GUARDAR CARRITO
function guardarCarrito() {
    localStorage.setItem("carritoLS", JSON.stringify(carrito));
}

// AGREGAR PRODUCTO
function agregarProducto(id) {
    const productoExistente = carrito.find(item => item.id === id);

    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push({ id: id, cantidad: 1 });
    }

    actualizarCarrito();
}

// CAMBIAR FAVORITO
function cambiarFavorito(id) {
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(favorito => favorito !== id);
    } else {
        favoritos.push(id);
    }

    localStorage.setItem("favoritosLS", JSON.stringify(favoritos));
    aplicarFiltros();

    mostrarFavoritos();
}

// MOSTRAR CARRITO
function mostrarCarrito() {
    if (carrito.length === 0) {
        contenedorCarrito.innerHTML = "<p>Tu carrito está vacío.</p>";
        contador.textContent = 0;
        total.textContent = "0";
        return;
    }

    contenedorCarrito.innerHTML = carrito.map(item => {
        const producto = productos.find(p => p.id === item.id);

        if (!producto) return "";

        return `
            <div class="item-carrito">
                <h3>${producto.nombre}</h3>
                <p>$${producto.precio.toLocaleString("es-AR")}</p>

                <button data-accion="disminuir" data-id="${producto.id}">-</button>
                <span>${item.cantidad}</span>
                <button data-accion="aumentar" data-id="${producto.id}">+</button>
                <button data-accion="eliminar" data-id="${producto.id}">Eliminar</button>

                <p>Subtotal: $${(producto.precio * item.cantidad).toLocaleString("es-AR")}</p>
            </div>
        `;
    }).join("");
}

// ACTUALIZAR CARRITO
function actualizarCarrito() {
    guardarCarrito();
    mostrarCarrito();

    const cantidadTotal = carrito.reduce(
        (acumulador, item) => acumulador + item.cantidad, 0
    );

    contador.textContent = cantidadTotal;

    const precioTotal = carrito.reduce((acumulador, item) => {
        const producto = productos.find(p => p.id === item.id);
        return acumulador + (producto ? producto.precio * item.cantidad : 0);
    }, 0);

    total.textContent = precioTotal.toLocaleString("es-AR");
}

// EVENTOS DE LOS PRODUCTOS
contenedorProductos.addEventListener("click", function(e) {
    const boton = e.target.closest("[data-accion]");
    if (!boton) return;

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;

    if (accion === "agregar") {
        agregarProducto(id);
    }

    if (accion === "favorito") {
        cambiarFavorito(id);
    }
});

// EVENTOS DEL CARRITO
contenedorCarrito.addEventListener("click", function(e) {
    const boton = e.target.closest("[data-accion]");
    if (!boton) return;

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;

    const item = carrito.find(producto => producto.id === id);
    if (!item) return;

    if (accion === "aumentar") {
        item.cantidad++;
    }

    if (accion === "disminuir") {
        item.cantidad--;

        if (item.cantidad <= 0) {
            carrito = carrito.filter(producto => producto.id !== id);
        }
    }

    if (accion === "eliminar") {
        carrito = carrito.filter(producto => producto.id !== id);
    }

    actualizarCarrito();
});

// BUSCADOR Y FILTRO
function aplicarFiltros() {
    const texto = buscador.value.toLowerCase();
    const categoria = filtroCategoria.value;

    const productosFiltrados = productos.filter(producto => {
        const coincideNombre = producto.nombre.toLowerCase().includes(texto);
        const coincideCategoria =
            categoria === "todas" || producto.categoria === categoria;

        return coincideNombre && coincideCategoria;
    });

    mostrarProductos(productosFiltrados);
}

// EVENTOS DEL BUSCADOR Y FILTRO
buscador.addEventListener("input", aplicarFiltros);
filtroCategoria.addEventListener("change", aplicarFiltros);

// INICIAR PÁGINA
aplicarFiltros();
actualizarCarrito();
mostrarFavoritos();

// MODO CLARO Y OSCURO

// MODO CLARO Y OSCURO
const botonTema = document.querySelector("#btn-tema");

// Recuperar el tema guardado
let modoOscuro = localStorage.getItem("temaLS") === "oscuro";

// Aplicar el tema
function aplicarTema() {
    document.body.classList.toggle("modo-oscuro", modoOscuro);

    if (botonTema) {
        botonTema.textContent = modoOscuro
            ? "☀️ Activar modo claro"
            : "🌙 Activar modo oscuro";
    }
}

// Cambiar el tema al presionar el botón
if (botonTema) {
    botonTema.addEventListener("click", function() {
        modoOscuro = !modoOscuro;

        localStorage.setItem(
            "temaLS",
            modoOscuro ? "oscuro" : "claro"
        );

        aplicarTema();
    });
}

// Iniciar con el tema guardado
aplicarTema();

