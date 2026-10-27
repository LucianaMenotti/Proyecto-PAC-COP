const estilos = String.raw`
body {
    font-family: Arial, sans-serif;
}
.hero {
    min-height: 600px;
    display: flex;
    align-items: center;
}
.service-card {
    transition: transform 0.2s ease;
}
.service-card:hover {
    transform: translateY(-5px);
}
.cta-box {
    background-color: #eef5ff;
    border-radius: 20px;
}
.form-container {
    max-width: 600px;
    margin: 50px auto;
}
.profile-header {
    background-color: #eef5ff;
    border-radius: 20px;
}
@media (max-width: 768px) {
    .hero {
        text-align: center;
        min-height: auto;
    }
    .hero-icon {
        font-size: 120px;
    }
}
`;

export default estilos;
