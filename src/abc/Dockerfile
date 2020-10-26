# FROM python:3.8-alpine
FROM python:3.8-buster

USER root

WORKDIR /usr/src/app
# COPY src/abc/Pipfile src/abc/Pipfile.lock src/abc/uwsgi.ini src/abc/src/*.py ./
# COPY Pipfile Pipfile.lock uwsgi.ini src/*.py ./
# COPY . .
COPY src/abc .

# See https://pypi.org/project/mysqlclient/
# RUN apk add --no-cache build-base linux-headers mariadb-connector-c-dev && \
#     pip install pipenv && \
#     pipenv install --deploy --system
RUN pip install pipenv && \
    pipenv install --deploy --system



WORKDIR /usr/src/app/src
CMD ["uwsgi", "--ini", "/usr/src/app/uwsgi.ini"]
