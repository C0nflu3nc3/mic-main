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


def get_news(conn, publication_status=1):
    with conn.cursor() as cursor:
        where_clause = ""
        params = ()
        if publication_status is not None:
            where_clause = "WHERE COALESCE(News.is_published, 1) = %s"
            params = (int(publication_status),)

        sql = """
            SELECT
                News.id,
                News.title,
                News.content,
                News.image_path,
                News.video_path,
                COALESCE(News.is_published, 1) AS is_published,
                News.created_at,
                users.login AS author_name
            FROM News
            JOIN users ON users.id = News.user_id
            {where_clause}
            ORDER BY News.created_at DESC, News.id DESC
        """
        cursor.execute(sql.format(where_clause=where_clause), params)
        news_rows = cursor.fetchall()

        media_sql = """
            SELECT
                News_media.id,
                News_media.news_id,
                News_media.media_path,
                News_media.media_type,
                News_media.sort_order
            FROM News_media
            ORDER BY News_media.sort_order ASC, News_media.id ASC
        """
        cursor.execute(media_sql)
        media_rows = cursor.fetchall()

        comment_sql = """
            SELECT
                News_comment.id,
                News_comment.news_id,
                News_comment.user_id,
                News_comment.parent_comment_id,
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
    comments_by_id = {}
    for comment in comments:
        comment["replies"] = []
        comment["user_id"] = int(comment["user_id"])
        comment["parent_comment_id"] = (
            int(comment["parent_comment_id"]) if comment.get("parent_comment_id") is not None else None
        )
        comments_by_id[int(comment["id"])] = comment

    for comment in comments:
        news_id = int(comment["news_id"])
        parent_comment_id = comment.get("parent_comment_id")
        if parent_comment_id and parent_comment_id in comments_by_id:
            comments_by_id[parent_comment_id]["replies"].append(comment)
        else:
            comments_by_news.setdefault(news_id, []).append(comment)

    media_by_news = {}
    for media in media_rows:
        news_id = int(media["news_id"])
        media_by_news.setdefault(news_id, []).append(media)

    result = []
    for row in news_rows:
        news_id = int(row["id"])
        news_media = list(media_by_news.get(news_id, []))
        existing_paths = {item["media_path"] for item in news_media}

        if row.get("image_path") and row["image_path"] not in existing_paths:
            news_media.append(
                {
                    "news_id": news_id,
                    "media_path": row["image_path"],
                    "media_type": "image",
                    "sort_order": -2,
                }
            )

        if row.get("video_path") and row["video_path"] not in existing_paths:
            news_media.append(
                {
                    "news_id": news_id,
                    "media_path": row["video_path"],
                    "media_type": "video",
                    "sort_order": -1,
                }
            )

        news_media.sort(key=lambda item: (int(item.get("sort_order") or 0), int(item.get("id") or 0)))
        row["media"] = news_media
        row["comments"] = comments_by_news.get(news_id, [])
        result.append(row)

    return result


def ensure_news_media_columns(conn):
    schema_changed = False
    with conn.cursor() as cursor:
        cursor.execute("SHOW COLUMNS FROM News LIKE 'is_published'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE News
                ADD COLUMN is_published tinyint(1) NOT NULL DEFAULT 1 AFTER user_id
                """
            )
            schema_changed = True

        cursor.execute("SHOW COLUMNS FROM News LIKE 'video_path'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE News
                ADD COLUMN video_path varchar(255) DEFAULT NULL AFTER image_path
                """
            )
            schema_changed = True

        cursor.execute("SHOW TABLES LIKE 'News_media'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                CREATE TABLE News_media (
                    id int NOT NULL AUTO_INCREMENT,
                    news_id int NOT NULL,
                    media_path varchar(255) NOT NULL,
                    media_type varchar(20) NOT NULL,
                    sort_order int NOT NULL DEFAULT 0,
                    created_at datetime NOT NULL,
                    PRIMARY KEY (id),
                    KEY idx_news_media_news_id (news_id),
                    KEY idx_news_media_sort_order (news_id, sort_order, id),
                    CONSTRAINT fk_news_media_news FOREIGN KEY (news_id) REFERENCES News (id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """
            )
            schema_changed = True

        cursor.execute(
            """
            INSERT INTO News_media (news_id, media_path, media_type, sort_order, created_at)
            SELECT News.id, News.image_path, 'image', 0, News.created_at
            FROM News
            WHERE News.image_path IS NOT NULL
              AND News.image_path <> ''
              AND NOT EXISTS (
                  SELECT 1
                  FROM News_media
                  WHERE News_media.news_id = News.id
                    AND News_media.media_path = News.image_path
              )
            """
        )
        if cursor.rowcount > 0:
            schema_changed = True

        cursor.execute(
            """
            INSERT INTO News_media (news_id, media_path, media_type, sort_order, created_at)
            SELECT News.id, News.video_path, 'video', 1, News.created_at
            FROM News
            WHERE News.video_path IS NOT NULL
              AND News.video_path <> ''
              AND NOT EXISTS (
                  SELECT 1
                  FROM News_media
                  WHERE News_media.news_id = News.id
                    AND News_media.media_path = News.video_path
              )
            """
        )
        if cursor.rowcount > 0:
            schema_changed = True
    if schema_changed:
        conn.commit()


def ensure_news_comment_columns(conn):
    schema_changed = False
    with conn.cursor() as cursor:
        cursor.execute("SHOW COLUMNS FROM News_comment LIKE 'parent_comment_id'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE News_comment
                ADD COLUMN parent_comment_id int DEFAULT NULL AFTER user_id
                """
            )
            schema_changed = True

        cursor.execute("SHOW INDEX FROM News_comment WHERE Key_name = 'idx_news_comment_parent'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE News_comment
                ADD INDEX idx_news_comment_parent (parent_comment_id)
                """
            )
            schema_changed = True
    if schema_changed:
        conn.commit()


def add_news(conn, user_id, title, content, image_path, video_path, media_items=None, is_published=1):
    with conn.cursor() as cursor:
        sql = """
            INSERT INTO News (title, content, image_path, video_path, user_id, is_published, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """
        cursor.execute(sql, (title, content, image_path, video_path, user_id, int(is_published)))
        news_id = int(cursor.lastrowid)

        if media_items:
            media_sql = """
                INSERT INTO News_media (news_id, media_path, media_type, sort_order, created_at)
                VALUES (%s, %s, %s, %s, NOW())
            """
            cursor.executemany(
                media_sql,
                [
                    (
                        news_id,
                        item["media_path"],
                        item["media_type"],
                        int(item["sort_order"]),
                    )
                    for item in media_items
                ],
            )
    conn.commit()
    return news_id


def get_news_for_update(conn, news_id):
    with conn.cursor() as cursor:
        news_sql = """
            SELECT id, title, content, COALESCE(is_published, 1) AS is_published
            FROM News
            WHERE id = %s
            LIMIT 1
        """
        cursor.execute(news_sql, (news_id,))
        news_row = cursor.fetchone()
        if news_row is None:
            return None

        media_sql = """
            SELECT id, news_id, media_path, media_type, sort_order
            FROM News_media
            WHERE news_id = %s
            ORDER BY sort_order ASC, id ASC
        """
        cursor.execute(media_sql, (news_id,))
        news_row["media"] = cursor.fetchall()
        return news_row


def update_news(conn, news_id, title, content, media_items):
    image_path = next((item["media_path"] for item in media_items if item["media_type"] == "image"), None)
    video_path = next((item["media_path"] for item in media_items if item["media_type"] == "video"), None)

    with conn.cursor() as cursor:
        update_sql = """
            UPDATE News
            SET title = %s,
                content = %s,
                image_path = %s,
                video_path = %s
            WHERE id = %s
        """
        cursor.execute(update_sql, (title, content, image_path, video_path, news_id))

        cursor.execute("DELETE FROM News_media WHERE news_id = %s", (news_id,))

        if media_items:
            insert_sql = """
                INSERT INTO News_media (news_id, media_path, media_type, sort_order, created_at)
                VALUES (%s, %s, %s, %s, NOW())
            """
            cursor.executemany(
                insert_sql,
                [
                    (
                        news_id,
                        item["media_path"],
                        item["media_type"],
                        int(item["sort_order"]),
                    )
                    for item in media_items
                ],
            )
    conn.commit()
    return True


def count_pending_news(conn):
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM News
            WHERE COALESCE(is_published, 1) = 0
            """
        )
        row = cursor.fetchone()
        return int(row["total"] or 0)


def publish_news(conn, news_id):
    with conn.cursor() as cursor:
        cursor.execute(
            """
            UPDATE News
            SET is_published = 1
            WHERE id = %s AND COALESCE(is_published, 1) = 0
            """,
            (news_id,),
        )
        updated = cursor.rowcount > 0
    conn.commit()
    return updated


def reject_news(conn, news_id):
    with conn.cursor() as cursor:
        cursor.execute(
            """
            DELETE FROM News_comment
            WHERE news_id = %s
            """,
            (news_id,),
        )
        cursor.execute(
            """
            DELETE FROM News_media
            WHERE news_id = %s
            """,
            (news_id,),
        )
        cursor.execute(
            """
            DELETE FROM News
            WHERE id = %s AND COALESCE(is_published, 1) = 0
            """,
            (news_id,),
        )
        deleted = cursor.rowcount > 0
    conn.commit()
    return deleted


def add_news_comment(conn, news_id, user_id, comment, parent_comment_id=None):
    with conn.cursor() as cursor:
        check_sql = "SELECT id FROM News WHERE id = %s AND COALESCE(is_published, 1) = 1 LIMIT 1"
        cursor.execute(check_sql, (news_id,))
        if cursor.fetchone() is None:
            return False

        if parent_comment_id is not None:
            parent_sql = """
                SELECT id
                FROM News_comment
                WHERE id = %s AND news_id = %s
                LIMIT 1
            """
            cursor.execute(parent_sql, (parent_comment_id, news_id))
            if cursor.fetchone() is None:
                return False

        sql = """
            INSERT INTO News_comment (news_id, user_id, parent_comment_id, comment, created_at)
            VALUES (%s, %s, %s, %s, NOW())
        """
        cursor.execute(sql, (news_id, user_id, parent_comment_id, comment))
    conn.commit()
    return True


def delete_news_comment(conn, comment_id, current_user_id, can_manage_all=False):
    with conn.cursor() as cursor:
        select_sql = """
            SELECT id, user_id
            FROM News_comment
            WHERE id = %s
            LIMIT 1
        """
        cursor.execute(select_sql, (comment_id,))
        comment_row = cursor.fetchone()
        if comment_row is None:
            return False, "Комментарий не найден"

        if not can_manage_all and int(comment_row["user_id"]) != int(current_user_id):
            return False, "Недостаточно прав для удаления комментария"

        delete_sql = """
            DELETE FROM News_comment
            WHERE id = %s OR parent_comment_id = %s
        """
        cursor.execute(delete_sql, (comment_id, comment_id))
    conn.commit()
    return True, "Комментарий удалён"


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
