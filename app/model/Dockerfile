FROM ollama/ollama:0.20.5

ENV OLLAMA_HOST=0.0.0.0:11434

RUN ollama serve > /tmp/ollama.log 2>&1 & \
    sleep 10 && \
    ollama pull qwen2.5:14b

EXPOSE 11434

CMD ["serve"]
