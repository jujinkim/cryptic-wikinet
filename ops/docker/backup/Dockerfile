FROM alpine:3.22

RUN apk add --no-cache bash curl postgresql17-client restic tzdata

COPY backup-loop.sh /usr/local/bin/backup-loop.sh
COPY run-backup.sh /usr/local/bin/run-backup.sh
RUN chmod +x /usr/local/bin/backup-loop.sh /usr/local/bin/run-backup.sh

CMD ["/usr/local/bin/backup-loop.sh"]
