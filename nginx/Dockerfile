FROM nginx:1.30-alpine

# Obraz nginx sam wpisze serwery DNS kontenera do ${NGINX_LOCAL_RESOLVERS} w szablonie.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
COPY default.conf.template /etc/nginx/templates/default.conf.template
