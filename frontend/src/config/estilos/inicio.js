const estilos = String.raw`
.hero-cuenta {
  background:
    radial-gradient(60rem 28rem at 85% -10%, var(--pac-primary-soft), transparent 70%),
    var(--bg);
}

.feature-card {
  background: var(--surface);
  border: 1px solid var(--border);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: var(--pac-primary);
  box-shadow: var(--shadow-md) !important;
}

.feature-card h3 {
  color: var(--text-strong);
}

.profile-chip {
  background: var(--surface);
  border: 1px solid var(--border);
}
`;

export default estilos;
