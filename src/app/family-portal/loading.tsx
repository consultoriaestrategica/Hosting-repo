import { Heart, Activity, FileText } from "lucide-react"

/**
 * Loading State del Portal Familiar
 * 
 * Este componente se muestra mientras Next.js carga el contenido de las páginas
 * dentro de /family-portal (Suspense boundary automático de Next.js 15)
 * 
 * Características:
 * - Diseño consistente con el portal familiar
 * - Animaciones suaves y profesionales
 * - Indicadores visuales del tipo de contenido que se está cargando
 * - Responsive y accesible
 * 
 * Se activa automáticamente cuando:
 * - Se carga la página por primera vez
 * - Se navega entre páginas del portal
 * - Se están obteniendo datos del servidor
 */
export default function FamilyPortalLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* Card principal de loading */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          
          {/* Logo/Icono principal */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {/* Círculo animado de fondo */}
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
              
              {/* Icono principal */}
              <div className="relative bg-primary rounded-full p-4">
                <Heart className="h-12 w-12 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Portal Familiar
          </h2>
          
          {/* Subtítulo */}
          <p className="text-center text-gray-600 mb-6">
            Hogar San Juan
          </p>

          {/* Spinner principal */}
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
          </div>

          {/* Mensaje de carga */}
          <p className="text-center text-lg font-semibold text-gray-700 mb-2">
            Cargando información...
          </p>
          <p className="text-center text-sm text-gray-500 mb-6">
            Por favor espere un momento
          </p>

          {/* Indicadores de lo que se está cargando */}
          <div className="space-y-3">
            {/* Indicador 1: Datos del residente */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <Activity className="h-4 w-4" />
                <span>Cargando datos del residente...</span>
              </div>
            </div>

            {/* Indicador 2: Registros médicos */}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
              <div className="flex items-center gap-2 text-sm text-green-900">
                <FileText className="h-4 w-4" />
                <span>Obteniendo registros recientes...</span>
              </div>
            </div>

            {/* Indicador 3: Eventos */}
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
              <div className="flex items-center gap-2 text-sm text-purple-900">
                <Heart className="h-4 w-4" />
                <span>Sincronizando información...</span>
              </div>
            </div>
          </div>

          {/* Skeleton loaders (simulación de contenido) */}
          <div className="mt-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
          </div>

          {/* Mensaje de seguridad/información */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900 text-center">
              🔒 Conexión segura cifrada
            </p>
          </div>
        </div>

        {/* Texto adicional fuera del card */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Preparando su portal personalizado
        </p>
      </div>
    </div>
  )
}