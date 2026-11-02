FROM python:3.12-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
# Keep the browser binary inside the image at a fixed path
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app

# Copy dependency definitions and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Chromium plus every system library it needs for headless PDF rendering
RUN playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

# Copy application source code
COPY . .

# Render dynamically injects $PORT (defaults to 8000 if running locally)
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
