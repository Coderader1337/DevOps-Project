#!/bin/sh
set -eu

ip_address="$(ipconfig getifaddr en0 2>/dev/null || true)"

if [ -z "$ip_address" ]; then
  ip_address="$(ifconfig | awk '/inet / && $2 !~ /^127\\./ { print $2; exit }')"
fi

if [ -z "$ip_address" ]; then
  echo "Не удалось найти LAN IP. Проверь Wi-Fi/сеть на MacBook." >&2
  exit 1
fi

echo "Открой с телефона: http://$ip_address:8080"
