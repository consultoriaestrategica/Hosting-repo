
"use client"

import { useState, useEffect, useCallback } from 'react';

export type Settings = {
  prices: {
    'Básica': number;
    'Premium': number;
  };
  vatEnabled: boolean;
  vatRate: number;
  contractTemplate: string;
};

const initialContractTemplate = `
Eres un asistente legal experto en la redacción de contratos de servicios para hogares geriátricos en Colombia.
Tu tarea es generar el texto completo de un contrato de prestación de servicios en formato Markdown, siguiendo la estructura y el tono formal del modelo proporcionado.

**Utiliza los siguientes datos para personalizar el contrato:**

*   **Hogar Geriátrico:** "Hogar Geriátrico Ángel Guardián" con NIT "900.123.456-7", ubicado en "Calle de la Serenidad 123, Bogotá D.C.", representado por "Dr. Ana María Rojas".
*   **Residente:** {{{residentName}}} (C.C. {{{residentIdNumber}}}).
*   **Responsable Solidario:** {{{responsiblePartyName}}} (C.C. {{{responsiblePartyIdNumber}}}), con domicilio en {{{responsiblePartyAddress}}}, en calidad de {{{responsiblePartyKinship}}}.
*   **Fecha de Inicio:** {{{startDate}}}
*   **Fecha de Fin:** {{{endDate}}}
*   **Plan Contratado:** Plan {{{contractType}}}
*   **Habitación Asignada:** {{{roomType}}}
*   **Nivel de Dependencia:** {{{dependencyLevel}}}
*   **Valor Mensual del Contrato:** {{{contractValue}}}

**Estructura del Contrato:**

**Título:** CONTRATO DE PRESTACIÓN DE SERVICIOS DE CUIDADO Y BIENESTAR PARA EL ADULTO MAYOR

1.  **PARTES:** Identifica a "EL HOGAR" (Hogar Geriátrico Ángel Guardián), "EL RESPONSABLE" (con su nombre, cédula, parentesco y domicilio) y "EL RESIDENTE" (con su nombre y cédula).

2.  **CLÁUSULA PRIMERA - OBJETO:** Describe la prestación de servicios integrales. Detalla los servicios incluidos según el plan contratado.
    *   **Alojamiento:** Especifica el tipo de habitación ({{{roomType}}}).
    *   **Alimentación:** Cinco comidas diarias.
    *   **Cuidado y Asistencia:** Supervisión 24/7 para actividades de la vida diaria, adaptado al nivel de dependencia ({{{dependencyLevel}}}).
    *   **Administración de Medicamentos.**
    *   **Actividades Terapéuticas y Recreativas.**
    *   **Servicios Adicionales (SOLO para Plan Premium):**
        *   Atención médica especializada mensual.
        *   Sesiones de fisioterapia personalizadas (2 por semana).
        *   Acceso a sala de entretenimiento premium.

3.  **CLÁUSULA SEGUNDA - VALOR Y FORMA DE PAGO:**
    *   Establece el valor mensual del contrato usando el valor exacto proporcionado en la variable **{{{contractValue}}}**.
    *   Indica que el pago es anticipado dentro de los primeros 5 días hábiles de cada mes.

4.  **CLÁUSULA TERCERA - OBLIGACIONES DE EL HOGAR:** Lista las responsabilidades del hogar.

5.  **CLÁUSULA CUARTA - OBLIGACIONES DE EL RESPONSABLE:** Lista las responsabilidades del acudiente, incluyendo el suministro de medicamentos y elementos de uso personal.

6.  **CLÁUSULA QUINTA - DURACIÓN:** Especifica la duración del contrato usando la fecha de inicio y fin proporcionadas.

7.  **CLÁUSULA SEXTA - FIRMAS:** Deja espacios para las firmas de "EL HOGAR" (Representante Legal), "EL RESPONSABLE" y "EL RESIDENTE".

**Instrucciones Finales:**
*   Formatea el resultado final en **Markdown**, utilizando encabezados (#, ##), negritas (**) y listas (*).
*   NO incluyas ninguna explicación o texto introductorio antes del contrato.
*   El resultado debe empezar directamente con el título "CONTRATO DE PRESTACIÓN DE SERVICIOS...".
*   Mantén un lenguaje formal y legal apropiado para Colombia.
`;


const initialSettings: Settings = {
    prices: {
        'Básica': 2000000,
        'Premium': 3500000,
    },
    vatEnabled: false,
    vatRate: 19,
    contractTemplate: initialContractTemplate,
};

const SETTINGS_STORAGE_KEY = 'app_settings';

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Ensure contractTemplate exists in stored settings, if not, add it.
        if (!parsedSettings.contractTemplate) {
            parsedSettings.contractTemplate = initialContractTemplate;
        }
        setSettingsState(parsedSettings);
      } else {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(initialSettings));
        setSettingsState(initialSettings);
      }
    } catch (error) {
      console.error("Failed to access localStorage for settings", error);
      setSettingsState(initialSettings);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SETTINGS_STORAGE_KEY) {
        loadSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadSettings]);
  
  const setSettings = useCallback((newSettings: Settings | ((prev: Settings) => Settings)) => {
    const storedSettings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
    const updatedSettings = typeof newSettings === 'function' ? newSettings(storedSettings) : newSettings;
    
    setSettingsState(updatedSettings);

    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
        window.dispatchEvent(new StorageEvent('storage', {
            key: SETTINGS_STORAGE_KEY,
            newValue: JSON.stringify(updatedSettings),
        }));
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
    }
  }, []);


  return { settings, setSettings, isLoading };
}
