# The site, served by nginx. The unprivileged image runs nginx as a normal
# user, so it listens on port 8080 instead of 80. "stable" follows nginx's
# stable branch; the weekly build (.github/workflows/image.yml) picks up its
# security fixes.
FROM nginxinc/nginx-unprivileged:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Only the files of the site itself, so the Dockerfile, README and .git do not
# end up on the web server. A new file or folder of the site goes here too.
COPY index.html app.js /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 8080
