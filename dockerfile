# Usa una imagen ligera de Node.js
FROM node:18-alpine

# Crea un directorio de trabajo
WORKDIR /app

# Copia solo los archivos necesarios para producción
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

# Expone el puerto que usará Cloud Run
EXPOSE 8080

# Define la variable de entorno obligatoria para Next.js
ENV PORT=8080

# Ejecuta el servidor standalone
CMD ["node", "server.js"]
