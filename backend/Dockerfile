# RailGuard Backend Dockerfile
# Optimized for Hugging Face Spaces (CPU Inference, Port 7860) and Container Deployments
FROM python:3.10-slim

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860 \
    MODEL_PATH=/app/models/best.pt \
    DATA_YAML_PATH=/app/data.yaml

# Install system dependencies for OpenCV and Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for Hugging Face Spaces (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /app

# Copy requirements and install
COPY --chown=user:user backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --user -r /app/requirements.txt

# Copy checkpoint and dataset configuration
COPY --chown=user:user backend/models/best.pt /app/models/best.pt
COPY --chown=user:user data.yaml /app/data.yaml

# Copy application code
COPY --chown=user:user backend/app /app/backend/app

# Create persistent storage directories with permissions
RUN mkdir -p /app/backend/uploads/original /app/backend/uploads/annotated /app/backend/data

EXPOSE 7860

# Run uvicorn on port 7860 (Hugging Face Spaces default)
CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
