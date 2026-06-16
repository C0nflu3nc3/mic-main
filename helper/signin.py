import os
import secrets

from werkzeug.security import check_password_hash, generate_password_hash

from helper.connect import bit_to_int, get_connection


def password_uses_hash(stored_password):
    if not stored_password:
        return False
    return str(stored_password).startswith(("pbkdf2:", "scrypt:"))


def verify_password(stored_password, password):
    if password_uses_hash(stored_password):
        return check_password_hash(stored_password, password)
    return secrets.compare_digest(str(stored_password), password)


def sign_in_user(login, password, session_obj):
    if not login or not password:
        return False, "Введите логин и пароль"

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    users.id,
                    users.login,
                    users.password,
                    users.isAdmin,
                    users.isJournalist,
                    Teams.id AS team_id,
                    Teams.name AS view
                FROM users
                LEFT JOIN Teams ON users.id = Teams.user_id
                WHERE users.login = %s
                LIMIT 1
            """
            cursor.execute(sql, (login,))
            user = cursor.fetchone()

        if not user or not verify_password(user["password"], password):
            return False, "Неверный логин или пароль"

        if not password_uses_hash(user["password"]) and os.getenv("AUTO_HASH_PASSWORDS", "1") == "1":
            hashed_password = generate_password_hash(password)
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE users SET password = %s WHERE id = %s",
                    (hashed_password, int(user["id"])),
                )
            conn.commit()

        session_obj.clear()
        session_obj["user"] = {
            "id": int(user["id"]),
            "name": user["login"],
            "isadmin": bit_to_int(user["isAdmin"]),
            "isjournalist": bit_to_int(user["isJournalist"]),
            "team_id": int(user["team_id"]) if user["team_id"] is not None else None,
            "view": user["view"] if user["view"] else user["login"],
        }
        return True, "OK"
    finally:
        conn.close()
