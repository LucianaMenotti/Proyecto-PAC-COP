/* =========================================================
   Pac-Cop — chat.js
   Chat real conectado al backend de Pac-Cop.
   ========================================================= */

const getCurrentSession =
    window.PacCopAuth.getCurrentSession;

(async () => {
    "use strict";

    const chatThread =
        document.getElementById("chatThread");

    const chatForm =
        document.getElementById("chatForm");

    const chatInput =
        document.getElementById("chatInput");

    const chatAvatar =
        document.getElementById("chatAvatar");

    const chatContactName =
        document.getElementById("chatContactName");

    const badgeChat =
        document.getElementById("badgeChat");

    const params =
        new URLSearchParams(
            window.location.search
        );

    const servicioId =
        params.get("servicioId");

    if (!servicioId) {
        mostrarError(
            "No se indicó una reserva para este chat."
        );
        return;
    }

    let sesion;

    try {
        sesion =
            await getCurrentSession();
    } catch (error) {
        console.error(
            "Error al obtener la sesión:",
            error
        );

        mostrarError(
            "Necesitás iniciar sesión."
        );

        return;
    }

    if (!sesion) {
        mostrarError(
            "Necesitás iniciar sesión."
        );

        return;
    }

    console.log(
        "Sesión del chat:",
        sesion
    );

    console.log(
        "Servicio del chat:",
        servicioId
    );

    async function cargarMensajes() {
        try {
            const respuesta =
                await fetch(
                    `/api/mensajes/${servicioId}`,
                    {
                        credentials: "include"
                    }
                );

            const datos =
                await respuesta.json();

            console.log(
                "GET mensajes:",
                respuesta.status,
                datos
            );

            if (!respuesta.ok) {
                throw new Error(
                    datos.mensaje ||
                    "No se pudieron cargar los mensajes."
                );
            }

            renderizarMensajes(
                datos.mensajes || []
            );

        } catch (error) {
            console.error(
                "Error al cargar el chat:",
                error
            );

            mostrarError(
                error.message
            );
        }
    }

    function renderizarMensajes(
        mensajes
    ) {
        chatThread.innerHTML = "";

        if (!mensajes.length) {
            chatThread.innerHTML = `
                <div class="chat-empty">
                    Todavía no hay mensajes.
                </div>
            `;

            return;
        }

        mensajes.forEach(
            (mensaje) => {
                const esMio =
                    Number(
                        mensaje.remitenteId
                    ) ===
                    Number(
                        sesion.id
                    );

                const nombre =
                    `${mensaje.remitente?.nombre || ""} ${
                        mensaje.remitente?.apellido || ""
                    }`.trim();

                const fecha =
                    new Date(
                        mensaje.creadoEn
                    );

                const hora =
                    fecha.toLocaleTimeString(
                        "es-AR",
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );

                const bubble =
                    document.createElement(
                        "div"
                    );

                bubble.className =
                    `msg ${
                        esMio
                            ? "msg-me"
                            : "msg-them"
                    }`;

                bubble.innerHTML = `
                    ${escapeHtml(
                        mensaje.texto
                    )}

                    <span class="msg-time">
                        ${hora}
                    </span>
                `;

                chatThread.appendChild(
                    bubble
                );

                if (
                    !esMio &&
                    chatContactName
                ) {
                    chatContactName.textContent =
                        nombre ||
                        "Usuario";
                }
            }
        );

        scrollChatToBottom();

        if (badgeChat) {
            badgeChat.hidden = true;
            badgeChat.textContent = "0";
        }
    }

    async function enviarMensaje() {
        const texto =
            chatInput.value.trim();

        if (!texto) {
            return;
        }

        try {
            console.log(
                "Enviando mensaje...",
                {
                    servicioId,
                    texto
                }
            );

            const respuesta =
                await fetch(
                    `/api/mensajes/${servicioId}`,
                    {
                        method: "POST",

                        credentials: "include",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            texto
                        })
                    }
                );

            const datos =
                await respuesta.json();

            console.log(
                "POST mensaje:",
                respuesta.status,
                datos
            );

            if (!respuesta.ok) {
                throw new Error(
                    datos.mensaje ||
                    "No se pudo enviar el mensaje."
                );
            }

            chatInput.value = "";
            chatInput.style.height =
                "auto";

            await cargarMensajes();

            chatInput.focus();

        } catch (error) {
            console.error(
                "Error al enviar mensaje:",
                error
            );

            alert(
                error.message
            );
        }
    }

    function scrollChatToBottom() {
        chatThread.scrollTop =
            chatThread.scrollHeight;
    }

    function mostrarError(
        mensaje
    ) {
        chatThread.innerHTML = `
            <div class="chat-error">
                ${escapeHtml(mensaje)}
            </div>
        `;
    }

    function escapeHtml(
        texto
    ) {
        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            texto;

        return div.innerHTML;
    }

    chatInput?.addEventListener(
        "input",
        () => {
            chatInput.style.height =
                "auto";

            chatInput.style.height =
                Math.min(
                    chatInput.scrollHeight,
                    90
                ) + "px";
        }
    );

    chatForm?.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            enviarMensaje();
        }
    );

    await cargarMensajes();

    setInterval(
        cargarMensajes,
        5000
    );
})();