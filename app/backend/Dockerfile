FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend_main.py .
COPY agent_main.py .
COPY agent_tools.py .
COPY working_classes.py .

EXPOSE 8080

CMD ["uvicorn", "backend_main:api", "--host", "0.0.0.0", "--port", "8080"]
