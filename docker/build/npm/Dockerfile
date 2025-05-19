FROM node:22

COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Optional: If you *must* set inotify inside container (not recommended)
# RUN apt-get update && apt-get install -y procps \
#     && echo fs.inotify.max_user_watches=524288 >> /etc/sysctl.conf \
#     && sysctl -p

WORKDIR /var/www/html

ENTRYPOINT ["entrypoint.sh"]
CMD []
