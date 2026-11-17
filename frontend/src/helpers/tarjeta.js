export const formatearNumero = (valor) => {
  const digitos = valor.replace(/\D/g, "").slice(0, 16);

  return digitos.replace(/(\d{4})(?=\d)/g, "$1 ");
};

export const formatearVencimiento = (valor) => {
  let digitos = valor.replace(/\D/g, "").slice(0, 4);

  if (digitos.length > 2) {
    digitos = digitos.slice(0, 2) + "/" + digitos.slice(2);
  }

  return digitos;
};

export const formatearCvv = (valor) => valor.replace(/\D/g, "").slice(0, 4);

export function validarTarjeta(valores) {
  const errores = {};

  const numero = valores.numero.replace(/\s/g, "");

  if (numero.length < 16) {
    errores.numero = "Ingresá los 16 dígitos de la tarjeta.";
  }

  const nombre = valores.nombre.trim();

  if (nombre.length < 3) {
    errores.nombre = "Ingresá el nombre completo del titular.";
  }

  const coincideFormato = /^(0[1-9]|1[0-2])\/\d{2}$/.test(valores.vencimiento);

  if (!coincideFormato) {
    errores.vencimiento = "Formato inválido (MM/AA).";
  } else {
    const [mes, anio] = valores.vencimiento.split("/").map(Number);
    const hoy = new Date();
    const vencimiento = new Date(2000 + anio, mes - 1, 1);
    const limite = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    if (vencimiento < limite) {
      errores.vencimiento = "La tarjeta está vencida.";
    }
  }

  if (valores.cvv.length < 3) {
    errores.cvv = "CVV de 3 o 4 dígitos.";
  }

  const valido = Object.keys(errores).length === 0;

  return {
    valido,
    errores,
    datos: valido
      ? { numero, ultimosDigitos: numero.slice(-4), nombre, venc: valores.vencimiento }
      : null
  };
}
