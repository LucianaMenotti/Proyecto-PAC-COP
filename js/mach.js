document.addEventListener("DOMContentLoaded", () => {
    // Datos simulados de prestadores
    const providers = [
        { id: 1, name: "Carlos Mendoza", service: "Paseador de Perros", certified: false, rating: 4.2 },
        { id: 2, name: "Dra. Ana Ríos", service: "Veterinaria a Domicilio", certified: true, rating: 4.9 },
        { id: 3, name: "Roberto Gómez", service: "Cuidado Nocturno", certified: false, rating: 4.0 },
        { id: 4, name: "Lucía Fernández", service: "Adiestramiento Canino", certified: true, rating: 4.8 },
        { id: 5, name: "Clínica San Martín", service: "Guardia y Traslado", certified: true, rating: 5.0 }
    ];

    const providersList = document.getElementById("providers-list");
    const searchInput = document.getElementById("search-input");
    const btnSearch = document.getElementById("btn-search");
    const resultsCount = document.getElementById("results-count");

    // Modal
    const modal = document.getElementById("uncertified-modal");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const btnCancelReservation = document.getElementById("btn-cancel-reservation");
    const btnContinueReservation = document.getElementById("btn-continue-reservation");

    let selectedProvider = null;

    // ESCENARIO 1: Renderizar priorizando prestadores certificados
    function renderProviders(data) {
        providersList.innerHTML = "";

        // Ordenar: Certificados primero (true > false)
        const sortedData = [...data].sort((a, b) => b.certified - a.certified);

        resultsCount.textContent = `${sortedData.length} prestadores disponibles`;

        sortedData.forEach(provider => {
            const card = document.createElement("div");
            card.className = `provider-card ${provider.certified ? "certified" : ""}`;

            card.innerHTML = `
                <div class="provider-info">
                    <h3>
                        ${provider.name}
                        ${provider.certified 
                            ? `<span class="badge badge-certified">Certificado</span>` 
                            : `<span class="badge badge-uncertified">Sin Certificar</span>`}
                    </h3>
                    <p class="provider-service">${provider.service} • ★ ${provider.rating}</p>
                </div>
                <button class="btn btn-outline btn-select" data-id="${provider.id}">
                    Seleccionar
                </button>
            `;

            providersList.appendChild(card);
        });

        attachSelectEvents(sortedData);
    }

    // ESCENARIO 2: Intercepción de selección
    function attachSelectEvents(currentProviders) {
        const buttons = document.querySelectorAll(".btn-select");
        buttons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const providerId = parseInt(e.target.getAttribute("data-id"));
                selectedProvider = currentProviders.find(p => p.id === providerId);

                if (!selectedProvider.certified) {
                    // Muestra la alerta si NO posee certificado
                    modal.classList.remove("hidden");
                } else {
                    // Flujo normal para certificados
                    alert(`Has seleccionado a ${selectedProvider.name} (Certificado). Procediendo a la reserva...`);
                }
            });
        });
    }

    // Filtrado sencillo de búsqueda
    function handleSearch() {
        const query = searchInput.value.toLowerCase();
        const filtered = providers.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.service.toLowerCase().includes(query)
        );
        renderProviders(filtered);
    }

    // Eventos
    btnSearch.addEventListener("click", handleSearch);
    searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") handleSearch();
    });

    // Cerrar modal
    btnCloseModal.addEventListener("click", () => modal.classList.add("hidden"));
    
    // Acción: Volver y revisar certificados
    btnCancelReservation.addEventListener("click", () => {
        modal.classList.add("hidden");
        // Enfoca visualmente la lista
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Acción: Confirmar continuar sin certificado
    btnContinueReservation.addEventListener("click", () => {
        modal.classList.add("hidden");
        alert(`Procediendo con la reserva de ${selectedProvider.name} bajo la responsabilidad del usuario.`);
    });

    // Carga inicial
    renderProviders(providers);
});