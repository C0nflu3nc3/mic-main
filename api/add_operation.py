from api.functions import get_plt, get_team_name_by_team_id


def create_transfer(conn, is_admin, current_user_id, parent, target, score, comment):
    try:
        parent_team_id = int(parent)
        target_team_id = int(target)
        score_value = int(score)
    except (TypeError, ValueError):
        return False, "Некорректные данные"

    if parent_team_id == target_team_id:
        return False, "Нельзя отправить GRZ самому себе"

    if score_value <= 0:
        return False, "Количество должно быть больше нуля"

    if not is_admin:
        sender_team_id_real = current_user_id
        if parent_team_id != sender_team_id_real:
            return False, "Неверный отправитель"
    else:
        sender_team_id_real = parent_team_id

    sender_team_name = get_team_name_by_team_id(conn, sender_team_id_real)
    receiver_team_name = get_team_name_by_team_id(conn, target_team_id)

    if sender_team_name is None or receiver_team_name is None:
        return False, "Фракция не найдена"

    current_balance = get_plt(conn, sender_team_id_real)
    if current_balance < score_value:
        return False, "Недостаточно GRZ"

    base_comment = comment.strip()
    receiver_comment = base_comment or f"Пополнение от фракции {sender_team_name}"
    sender_comment = (
        f"{base_comment}: Передача GRZ фракции {receiver_team_name}"
        if base_comment
        else f"Передача GRZ фракции {receiver_team_name}"
    )

    try:
        with conn.cursor() as cursor:
            sql_insert = """
                INSERT INTO Operation (Period, Score, Team, Comment)
                VALUES (CURDATE(), %s, %s, %s)
            """
            cursor.execute(sql_insert, (score_value, target_team_id, receiver_comment))
            cursor.execute(sql_insert, (-score_value, sender_team_id_real, sender_comment))

        conn.commit()
        return True, "Перевод выполнен"
    except Exception:
        conn.rollback()
        return False, "Ошибка при выполнении перевода"
