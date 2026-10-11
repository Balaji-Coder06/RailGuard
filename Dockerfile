# RailGuard Root Dockerfile
# Optimized for Hugging Face Spaces (CPU Inference, Port 7860)
FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860 \
    MODEL_PATH=/app/backend/models/best.pt \
    DATA_YAML_PATH=/app/data.yaml

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /app

COPY --chown=user:user backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --user -r /app/backend/requirements.txt

COPY --chown=user:user backend/models/best.pt /app/backend/models/best.pt
COPY --chown=user:user data.yaml /app/data.yaml
COPY --chown=user:user backend/app /app/backend/app

RUN mkdir -p /app/backend/uploads/original /app/backend/uploads/annotated /app/backend/data

EXPOSE 7860

CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
