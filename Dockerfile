# ETAPA 1: Construcción (Build)
FROM node:20-alpine AS build-step

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos todo el proyecto
COPY . .

# Construimos la aplicación para producción
RUN npm run build

# ETAPA 2: Servidor de producción (Nginx)
FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos compilados desde la etapa anterior al servidor Nginx
# NOTA: La ruta dist/ea-backoffice-g5/browser es la estándar en las últimas versiones de Angular
COPY --from=build-step /app/dist/EA_BACKOFFICE_G5/browser /usr/share/nginx/html

# Exponemos el puerto 80 (puerto por defecto de Nginx)
EXPOSE 80

# Arrancamos Nginx
CMD ["nginx", "-g", "daemon off;"]