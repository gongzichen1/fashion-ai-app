FROM node:20-alpine AS web-build

WORKDIR /web
COPY src/feishu-web/package.json src/feishu-web/package-lock.json ./
RUN npm ci
COPY src/feishu-web/ ./

RUN npm run build

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    DEBUG=False \
    HOST=0.0.0.0 \
    PORT=5001 \
    WEB_DIST_DIR=/app/web-dist \
    DATABASE_URL=sqlite:////app/data/fashion_ai.db \
    UPLOAD_FOLDER=/app/uploads

WORKDIR /app

COPY src/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY src/backend/ ./
COPY --from=web-build /web/dist /app/web-dist

RUN mkdir -p /app/data /app/uploads

EXPOSE 5001

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT} --workers 2 --threads 4 --timeout 120 app:app"]
