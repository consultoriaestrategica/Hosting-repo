import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Una función de copiado más robusta que funciona en la mayoría de los navegadores y entornos.
export async function copyToClipboard(text: string): Promise<boolean> {
  // Intenta usar la API moderna y segura del Portapapeles primero
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Texto copiado al portapapeles exitosamente!");
      return true; // Éxito
    } catch (err) {
      // Si la API moderna falla (como en tu caso por la política de permisos),
      // no nos rendimos y probamos el método antiguo.
      console.warn("La API del portapapeles falló, intentando método alternativo.", err);
    }
  }

  // --- Método Alternativo (Fallback) para entornos restrictivos ---
  // Crea un <textarea> temporal que no sea visible
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Evita que la página se desplace al añadir el elemento
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    // Intenta ejecutar el comando de copiado
    const successful = document.execCommand('copy');
    if (successful) {
      console.log("Texto copiado usando el método alternativo.");
    }
    return successful; // Devuelve true si tuvo éxito
  } catch (err) {
    console.error("No se pudo copiar el texto con ninguno de los métodos.", err);
    return false; // Falló
  } finally {
    // Limpia y elimina el elemento temporal
    document.body.removeChild(textArea);
  }
}
