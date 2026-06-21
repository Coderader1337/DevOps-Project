import os
import socket

from flask import Flask, jsonify

app = Flask(__name__)

SERVICE_NAME = "devops-app"
VERSION = "1.0.0"
HOSTNAME = socket.gethostname()


@app.route("/")
def index():
    """Main endpoint returning service info."""
    return jsonify({"service": SERVICE_NAME, "version": VERSION, "hostname": HOSTNAME})


@app.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok"})


@app.route("/greeting")
def greeting():
    """Greeting endpoint with feature flag."""
    feature_flag = os.environ.get("FEATURE_NEW_GREETING", "false").lower() == "true"

    if feature_flag:
        response = {
            "message": "Welcome to our new DevOps platform!",
            "version": "2.0",
            "feature_enabled": True,
        }
    else:
        response = {
            "message": "Hello from DevOps App!",
            "version": "1.0",
            "feature_enabled": False,
        }

    return jsonify(response)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
