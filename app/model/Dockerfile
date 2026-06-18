FROM ollama/ollama:0.20.5

ENV OLLAMA_HOST=0.0.0.0:11434

RUN ollama serve > /tmp/ollama.log 2>&1 & \
    sleep 10 && \
    ollama pull llama3.2:3b

EXPOSE 11434

CMD ["serve"]