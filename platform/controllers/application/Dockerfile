FROM python:3.10-slim

RUN pip install --no-cache-dir kopf kubernetes

ADD src /src

CMD kopf run /src/handlers.py --verbose
