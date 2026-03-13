from helper.connect import bit_to_int


def get_plt(conn, team_id):
    with conn.cursor() as cursor:
        sql = """
            SELECT COALESCE(SUM(Score), 0) AS score
            FROM Operation
            WHERE Team = %s
        """
        cursor.execute(sql, (team_id,))
        row = cursor.fetchone()
        return int(row["score"] or 0)


def get_scoreboard(conn):
    with conn.cursor() as cursor:
        sql = """
            SELECT Teams.name AS Name, COALESCE(SUM(Operation.Score), 0) AS Scores
            FROM Teams
            LEFT JOIN Operation ON Teams.id = Operation.Team
            GROUP BY Teams.id, Teams.name
            ORDER BY Scores DESC, Teams.name ASC
        """
        cursor.execute(sql)
        return cursor.fetchall()


def get_leaderboard_table(conn, table_name):
    allowed_tables = {"Overall_leader", "Duel_leader"}
    if table_name not in allowed_tables:
        raise ValueError("Unsupported leaderboard table")

    with conn.cursor() as cursor:
        sql = f"""
            SELECT leaderboard.name AS Name, leaderboard.score AS Scores
            FROM {table_name} AS leaderboard
            JOIN users ON users.id = leaderboard.user_id
            WHERE users.isAdmin = b'0' AND users.isJournalist = b'0'
            ORDER BY leaderboard.score DESC, leaderboard.name ASC
        """
        cursor.execute(sql)
        return cursor.fetchall()


def get_news(conn):
    with conn.cursor() as cursor:
        sql = """
            SELECT
                News.id,
                News.title,
                News.content,
                News.image_path,
                News.created_at,
                users.login AS author_name
            FROM News
            JOIN users ON users.id = News.user_id
            ORDER BY News.created_at DESC, News.id DESC
        """
        cursor.execute(sql)
        news_rows = cursor.fetchall()

        comment_sql = """
            SELECT
                News_comment.id,
                News_comment.news_id,
                News_comment.comment,
                News_comment.created_at,
                users.login AS author_name
            FROM News_comment
            JOIN users ON users.id = News_comment.user_id
            ORDER BY News_comment.created_at ASC, News_comment.id ASC
        """
        cursor.execute(comment_sql)
        comments = cursor.fetchall()

    comments_by_news = {}
    for comment in comments:
        comments_by_news.setdefault(int(comment["news_id"]), []).append(comment)

    result = []
    for row in news_rows:
        news_id = int(row["id"])
        row["comments"] = comments_by_news.get(news_id, [])
        result.append(row)

    return result


def add_news(conn, user_id, title, content, image_path):
    with conn.cursor() as cursor:
        sql = """
            INSERT INTO News (title, content, image_path, user_id, created_at)
            VALUES (%s, %s, %s, %s, NOW())
        """
        cursor.execute(sql, (title, content, image_path, user_id))
    conn.commit()


def add_news_comment(conn, news_id, user_id, comment):
    with conn.cursor() as cursor:
        check_sql = "SELECT id FROM News WHERE id = %s LIMIT 1"
        cursor.execute(check_sql, (news_id,))
        if cursor.fetchone() is None:
            return False

        sql = """
            INSERT INTO News_comment (news_id, user_id, comment, created_at)
            VALUES (%s, %s, %s, NOW())
        """
        cursor.execute(sql, (news_id, user_id, comment))
    conn.commit()
    return True


def create_mission(conn, title, description, reward, user_id):
    with conn.cursor() as cursor:
        sql = """
            INSERT INTO Mission (title, description, reward, user_id, created_at)
            VALUES (%s, %s, %s, %s, NOW())
        """
        cursor.execute(sql, (title, description, reward, user_id))
    conn.commit()


def get_missions(conn, current_team_id=None):
    with conn.cursor() as cursor:
        missions_sql = """
            SELECT
                Mission.id,
                Mission.title,
                Mission.description,
                Mission.reward,
                Mission.created_at,
                users.login AS author_name
            FROM Mission
            JOIN users ON users.id = Mission.user_id
            ORDER BY Mission.created_at DESC, Mission.id DESC
        """
        cursor.execute(missions_sql)
        missions = cursor.fetchall()

        assignments_sql = """
            SELECT
                Mission_team.id,
                Mission_team.mission_id,
                Mission_team.team_id,
                Mission_team.status,
                Mission_team.accepted_at,
                Teams.name AS team_name
            FROM Mission_team
            JOIN Teams ON Teams.id = Mission_team.team_id
            WHERE Mission_team.status = 'accepted'
            ORDER BY Mission_team.accepted_at ASC, Mission_team.id ASC
        """
        cursor.execute(assignments_sql)
        assignments = cursor.fetchall()

    assignments_by_mission = {}
    active_count_by_team = {}

    for assignment in assignments:
        mission_id = int(assignment["mission_id"])
        team_id = int(assignment["team_id"])
        assignments_by_mission.setdefault(mission_id, []).append(assignment)
        active_count_by_team[team_id] = active_count_by_team.get(team_id, 0) + 1

    result = []
    for mission in missions:
        mission_id = int(mission["id"])
        mission_assignments = assignments_by_mission.get(mission_id, [])
        mission["accepted_count"] = len(mission_assignments)
        mission["accepted_teams"] = [item["team_name"] for item in mission_assignments]
        mission["user_has_taken"] = any(
            int(item["team_id"]) == int(current_team_id)
            for item in mission_assignments
        ) if current_team_id is not None else False
        result.append(mission)

    team_active_count = active_count_by_team.get(int(current_team_id), 0) if current_team_id is not None else 0
    return result, team_active_count


def accept_mission(conn, mission_id, team_id):
    with conn.cursor() as cursor:
        mission_sql = "SELECT id FROM Mission WHERE id = %s LIMIT 1"
        cursor.execute(mission_sql, (mission_id,))
        if cursor.fetchone() is None:
            return False, "Задание не найдено"

        same_day_sql = """
            SELECT id
            FROM Mission_team
            WHERE mission_id = %s
              AND team_id = %s
              AND (
                  DATE(accepted_at) = CURDATE()
                  OR DATE(rejected_at) = CURDATE()
              )
            LIMIT 1
        """
        cursor.execute(same_day_sql, (mission_id, team_id))
        if cursor.fetchone():
            return False, "Этот отряд уже брал это задание сегодня"

        mission_count_sql = """
            SELECT COUNT(*) AS total
            FROM Mission_team
            WHERE mission_id = %s AND status = 'accepted'
        """
        cursor.execute(mission_count_sql, (mission_id,))
        mission_count = int(cursor.fetchone()["total"] or 0)
        if mission_count >= 3:
            return False, "На это задание уже откликнулись 3 отряда"

        team_count_sql = """
            SELECT COUNT(*) AS total
            FROM Mission_team
            WHERE team_id = %s AND status = 'accepted'
        """
        cursor.execute(team_count_sql, (team_id,))
        team_count = int(cursor.fetchone()["total"] or 0)
        if team_count >= 3:
            return False, "Отряд уже взял максимальные 3 задания"

        insert_sql = """
            INSERT INTO Mission_team (mission_id, team_id, status, accepted_at)
            VALUES (%s, %s, 'accepted', NOW())
        """
        cursor.execute(insert_sql, (mission_id, team_id))

    conn.commit()
    return True, "Задание принято"


def cancel_mission(conn, mission_id, team_id):
    with conn.cursor() as cursor:
        select_sql = """
            SELECT id
            FROM Mission_team
            WHERE mission_id = %s AND team_id = %s AND status = 'accepted'
            ORDER BY accepted_at DESC, id DESC
            LIMIT 1
        """
        cursor.execute(select_sql, (mission_id, team_id))
        row = cursor.fetchone()
        if row is None:
            return False, "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u0430\u0437\u0430\u0442\u044c\u0441\u044f \u043e\u0442 \u0437\u0430\u0434\u0430\u043d\u0438\u044f"

        update_sql = """
            UPDATE Mission_team
            SET status = 'rejected', rejected_at = NOW(), rejected_by = NULL
            WHERE id = %s
        """
        cursor.execute(update_sql, (int(row["id"]),))

    conn.commit()
    return True, "\u041b\u0435\u0433\u0438\u043e\u043d \u043e\u0442\u043a\u0430\u0437\u0430\u043b\u0441\u044f \u043e\u0442 \u0437\u0430\u0434\u0430\u043d\u0438\u044f"


def delete_mission(conn, mission_id):
    with conn.cursor() as cursor:
        select_sql = """
            SELECT id
            FROM Mission
            WHERE id = %s
            LIMIT 1
        """
        cursor.execute(select_sql, (mission_id,))
        if cursor.fetchone() is None:
            return False, "\u0417\u0430\u0434\u0430\u043d\u0438\u0435 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e"

        delete_sql = "DELETE FROM Mission WHERE id = %s"
        cursor.execute(delete_sql, (mission_id,))

    conn.commit()
    return True, "\u0417\u0430\u0434\u0430\u043d\u0438\u0435 \u0443\u0434\u0430\u043b\u0435\u043d\u043e"


def get_approve_queue(conn):
    with conn.cursor() as cursor:
        sql = """
            SELECT
                Mission_team.id,
                Mission.title,
                Mission.description,
                Mission.reward,
                Mission_team.accepted_at,
                Teams.name AS team_name
            FROM Mission_team
            JOIN Mission ON Mission.id = Mission_team.mission_id
            JOIN Teams ON Teams.id = Mission_team.team_id
            WHERE Mission_team.status = 'accepted'
            ORDER BY Mission_team.accepted_at ASC, Mission_team.id ASC
        """
        cursor.execute(sql)
        return cursor.fetchall()


def approve_mission(conn, assignment_id, admin_user_id):
    with conn.cursor() as cursor:
        select_sql = """
            SELECT
                Mission_team.id,
                Mission_team.team_id,
                Mission.title,
                Mission.reward
            FROM Mission_team
            JOIN Mission ON Mission.id = Mission_team.mission_id
            WHERE Mission_team.id = %s AND Mission_team.status = 'accepted'
            LIMIT 1
        """
        cursor.execute(select_sql, (assignment_id,))
        row = cursor.fetchone()
        if row is None:
            return False, "Задание не найдено или уже обработано"

        reward = int(row["reward"] or 0)
        team_id = int(row["team_id"])
        mission_title = row["title"]

        operation_sql = """
            INSERT INTO Operation (Period, Score, Team, Comment)
            VALUES (CURDATE(), %s, %s, %s)
        """
        cursor.execute(
            operation_sql,
            (reward, team_id, f"Награда за выполнение задания: {mission_title}"),
        )

        update_sql = """
            UPDATE Mission_team
            SET status = 'approved', approved_at = NOW(), approved_by = %s
            WHERE id = %s
        """
        cursor.execute(update_sql, (admin_user_id, assignment_id))

    conn.commit()
    return True, "Выполнение задания подтверждено"


def reject_mission(conn, assignment_id, admin_user_id):
    with conn.cursor() as cursor:
        select_sql = """
            SELECT id
            FROM Mission_team
            WHERE id = %s AND status = 'accepted'
            LIMIT 1
        """
        cursor.execute(select_sql, (assignment_id,))
        if cursor.fetchone() is None:
            return False, "Задание не найдено или уже обработано"

        update_sql = """
            UPDATE Mission_team
            SET status = 'rejected', rejected_at = NOW(), rejected_by = %s
            WHERE id = %s
        """
        cursor.execute(update_sql, (admin_user_id, assignment_id))

    conn.commit()
    return True, "Выполнение задания отклонено"


def get_operations(conn, is_admin, team_id):
    with conn.cursor() as cursor:
        if is_admin:
            sql = """
                SELECT Teams.name AS Name, Operation.Score, Operation.Period, Operation.Comment
                FROM Operation
                JOIN Teams ON Teams.id = Operation.Team
                ORDER BY Operation.Period DESC, Operation.id DESC
            """
            cursor.execute(sql)
        else:
            sql = """
                SELECT Teams.name AS Name, Operation.Score, Operation.Period, Operation.Comment
                FROM Operation
                JOIN Teams ON Teams.id = Operation.Team
                WHERE Operation.Team = %s
                ORDER BY Operation.Period DESC, Operation.id DESC
            """
            cursor.execute(sql, (team_id,))
        return cursor.fetchall()


def get_current_team_id_by_user_id(conn, user_id):
    with conn.cursor() as cursor:
        sql = "SELECT id FROM Teams WHERE user_id = %s LIMIT 1"
        cursor.execute(sql, (user_id,))
        row = cursor.fetchone()
        return int(row["id"]) if row else None


def get_teams_for_select(conn, is_admin, current_team_id):
    with conn.cursor() as cursor:
        if is_admin:
            sql = """
                SELECT Teams.id, Teams.name, users.isAdmin
                FROM Teams
                JOIN users ON Teams.user_id = users.id
                ORDER BY Teams.name
            """
            cursor.execute(sql)
        else:
            sql = """
                SELECT Teams.id, Teams.name, users.isAdmin
                FROM Teams
                JOIN users ON Teams.user_id = users.id
                WHERE Teams.id <> %s
                ORDER BY Teams.name
            """
            cursor.execute(sql, (current_team_id,))

        rows = cursor.fetchall()
        result = []

        for row in rows:
            result.append(
                {
                    "id": int(row["id"]),
                    "name": row["name"],
                    "isAdmin": bit_to_int(row["isAdmin"]),
                    "balance": get_plt(conn, int(row["id"])),
                }
            )

        return result


def get_team_name_by_team_id(conn, team_id):
    with conn.cursor() as cursor:
        sql = "SELECT name FROM Teams WHERE id = %s LIMIT 1"
        cursor.execute(sql, (team_id,))
        row = cursor.fetchone()
        return row["name"] if row else None


def get_team_user_id_by_team_id(conn, team_id):
    with conn.cursor() as cursor:
        sql = "SELECT user_id FROM Teams WHERE id = %s LIMIT 1"
        cursor.execute(sql, (team_id,))
        row = cursor.fetchone()
        return int(row["user_id"]) if row else None
