# Usa una imagen base oficial de Node.js
FROM node:16

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json primero para optimizar la caché de capas
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia todo el resto del código al contenedor
COPY . .

# Expone el puerto 3000 (el que usa el servidor)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]