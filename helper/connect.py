import os
import time

import pymysql


DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST"),
    "user": os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "database": os.getenv("MYSQL_DATABASE"),
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
    "autocommit": False,
}


def bit_to_int(value):
    if isinstance(value, (bytes, bytearray)):
        return 0 if value == b"\x00" else 1
    return int(value or 0)


def get_connection(retries=15, delay=2):
    required_keys = ("host", "user", "password", "database")
    missing = [key for key in required_keys if not DB_CONFIG.get(key)]
    if missing:
        raise RuntimeError(f"Missing database environment variables: {', '.join(missing)}")
    last_error = None

    for attempt in range(retries):
        try:
            return pymysql.connect(**DB_CONFIG)
        except pymysql.MySQLError as exc:
            last_error = exc
            if attempt == retries - 1:
                break
            time.sleep(delay)

    raise last_error

