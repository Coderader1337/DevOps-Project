# Root conftest.py — добавляет корень проекта в sys.path,
# чтобы pytest мог находить пакет app/ при запуске из любой директории.
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
