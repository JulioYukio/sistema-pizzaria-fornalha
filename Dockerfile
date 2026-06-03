# Usa a imagem oficial do Nginx como base
FROM nginx:alpine

# Copia todos os arquivos da sua pasta local para a pasta pública do Nginx
COPY . /usr/share/nginx/html/

# Expõe a porta 80 (porta padrão web)
EXPOSE 80

CMD nginx -g "daemon off";
