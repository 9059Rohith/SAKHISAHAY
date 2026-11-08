FROM python:3.12.12-slim AS builder
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY --from=builder /install /usr/local
RUN useradd --create-home --uid 10001 appuser
COPY backend/app backend/app
COPY backend/__init__.py backend/__init__.py
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=8s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health',timeout=5)"
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-access-log"]
