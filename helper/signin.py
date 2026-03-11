from helper.connect import bit_to_int, get_connection


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
                    users.isAdmin,
                    users.isJournalist,
                    Teams.id AS team_id,
                    Teams.name AS view
                FROM users
                LEFT JOIN Teams ON users.id = Teams.user_id
                WHERE users.login = %s AND users.password = %s
                LIMIT 1
            """
            cursor.execute(sql, (login, password))
            user = cursor.fetchone()

        if not user:
            return False, "Неверный логин или пароль"

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
