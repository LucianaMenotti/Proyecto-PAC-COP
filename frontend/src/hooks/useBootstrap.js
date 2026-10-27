import { useEstilos } from "./useEstilos";
import estilosBootstrap from "../config/estilos/bootstrap";
import estilosIconos from "../config/estilos/iconos";

export function useBootstrap(conIconos = false) {
  useEstilos("bootstrap", estilosBootstrap);
  useEstilos("iconos", conIconos ? estilosIconos : "");
}
