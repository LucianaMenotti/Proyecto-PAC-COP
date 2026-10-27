const estilos = String.raw`
:root {
  --pac-primary: #1f7a74;
  --pac-primary-dark: #155551;
  --pac-accent: #ff6f52;
  --pac-bg-soft: #f4fbf9;
}

body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #2c3e50;
  background: #f4fbf9;
}

.font-display {
  font-family: "Fraunces", serif;
}

.navbar-brand-pac {
  color: var(--pac-primary) !important;
  font-family: "Fraunces", serif;
  font-size: 1.5rem;
  font-weight: 700;
}

.text-primary-pac { color: var(--pac-primary) !important; }
.text-accent-pac { color: var(--pac-accent) !important; }
.btn-primary { background: var(--pac-primary); border-color: var(--pac-primary); }
.btn-primary:hover { background: var(--pac-primary-dark); border-color: var(--pac-primary-dark); }
.btn-outline-primary { color: var(--pac-primary); border-color: var(--pac-primary); }
.btn-outline-primary:hover { background: var(--pac-primary); border-color: var(--pac-primary); }
.hero-cuenta { background: linear-gradient(135deg, #eaf6f4, #f4fbf9); }
.feature-card { border: 1px solid #e3efed; transition: transform .2s ease, box-shadow .2s ease; }
.feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 25px rgba(31, 122, 116, .12) !important; }
.profile-chip { background: #fff; border: 1px solid #d9ebe8; }
`;

export default estilos;
