import os
import time
from urllib.parse import urlparse

import pymysql


def get_db_config():
    database_url = os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL")
    parsed_url = urlparse(database_url) if database_url else None

    return {
        "host": (
            os.getenv("MYSQL_HOST")
            or os.getenv("MYSQLHOST")
            or os.getenv("DB_HOST")
            or (parsed_url.hostname if parsed_url else None)
        ),
        "port": int(
            os.getenv("MYSQL_PORT")
            or os.getenv("MYSQLPORT")
            or os.getenv("DB_PORT")
            or (parsed_url.port if parsed_url and parsed_url.port else 3306)
        ),
        "user": (
            os.getenv("MYSQL_USER")
            or os.getenv("MYSQLUSER")
            or os.getenv("DB_USER")
            or (parsed_url.username if parsed_url else None)
            or "root"
        ),
        "password": (
            os.getenv("MYSQL_PASSWORD")
            or os.getenv("MYSQLPASSWORD")
            or os.getenv("MYSQL_ROOT_PASSWORD")
            or os.getenv("DB_PASSWORD")
            or (parsed_url.password if parsed_url else None)
        ),
        "database": (
            os.getenv("MYSQL_DATABASE")
            or os.getenv("MYSQLDATABASE")
            or os.getenv("DB_NAME")
            or (parsed_url.path.lstrip("/") if parsed_url and parsed_url.path else None)
        ),
        "charset": "utf8mb4",
        "cursorclass": pymysql.cursors.DictCursor,
        "autocommit": False,
    }


def bit_to_int(value):
    if isinstance(value, (bytes, bytearray)):
        return 0 if value == b"\x00" else 1
    return int(value or 0)


def get_connection(retries=15, delay=2):
    db_config = get_db_config()
    required_keys = ("host", "user", "password", "database")
    missing = [key for key in required_keys if not db_config.get(key)]
    if missing:
        raise RuntimeError(f"Missing database environment variables: {', '.join(missing)}")
    last_error = None

    for attempt in range(retries):
        try:
            return pymysql.connect(**db_config)
        except pymysql.MySQLError as exc:
            last_error = exc
            if attempt == retries - 1:
                break
            time.sleep(delay)

    raise last_error
