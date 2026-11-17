// Componentes de contenido compartidos por Landing y otras páginas públicas.
// Los colores y la tipografía vienen de styles/tema.css (claro y oscuro).
const estilos = String.raw`
.hero {
  position: relative;
  min-height: 560px;
  display: flex;
  align-items: center;
  background:
    radial-gradient(60rem 28rem at 85% -10%, var(--pac-primary-soft), transparent 70%),
    var(--bg);
}

.hero h1 {
  font-size: clamp(2.2rem, 5vw, 3.4rem);
}

.hero .lead {
  max-width: 34rem;
}

.service-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md) !important;
}

.cta-box {
  background: var(--pac-primary-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.form-container {
  max-width: 600px;
  margin: 50px auto;
}

.profile-header {
  background: var(--pac-primary-soft);
  border-radius: var(--radius-lg);
}

@media (max-width: 768px) {
  .hero {
    text-align: center;
    min-height: auto;
  }
}
`;

export default estilos;
