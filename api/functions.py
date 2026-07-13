from helper.connect import bit_to_int
from threading import Lock


_SCHEMA_READY = set()
_SCHEMA_LOCK = Lock()
_LEADERBOARD_TABLES = {
    "Overall_leader": "Overall_leader",
}
NEWS_REWARD_DAILY_LIMIT = 3
NEWS_REWARD_AMOUNT = 30
NEWS_REWARD_COMMENT = "Награда за публикацию новости"
COMMENT_REWARD_AMOUNT = 5
COMMENT_REWARD_DAILY_LIMIT = 25
COMMENT_REWARD_COMMENT = "Награда за комментарий под новостью"
NEWS_REVIEW_STATUS_PENDING = "pending"
NEWS_REVIEW_STATUS_REJECTED = "rejected"
NEWS_REVIEW_STATUS_PUBLISHED = "published"


def is_schema_ready(schema_name):
    with _SCHEMA_LOCK:
        return schema_name in _SCHEMA_READY


def mark_schema_ready(schema_name):
    with _SCHEMA_LOCK:
        _SCHEMA_READY.add(schema_name)


def get_leaderboard_table_name(table_name):
    normalized = _LEADERBOARD_TABLES.get(table_name)
    if normalized is None:
        raise ValueError("Unsupported leaderboard table")
    return normalized


def ensure_influence_log_table(conn):
    if is_schema_ready("influence_log"):
        return

    schema_changed = False
    with conn.cursor() as cursor:
        cursor.execute("SHOW TABLES LIKE 'Influence_log'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                CREATE TABLE Influence_log (
                    id int NOT NULL AUTO_INCREMENT,
                    user_id int NOT NULL,
                    delta int NOT NULL,
                    reason varchar(255) NOT NULL,
                    created_at datetime NOT NULL,
                    PRIMARY KEY (id),
                    KEY idx_influence_log_user_id (user_id),
                    KEY idx_influence_log_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """
            )
            schema_changed = True

    if schema_changed:
        conn.commit()
    mark_schema_ready("influence_log")


def log_influence_change(conn, user_id, delta, reason):
    ensure_influence_log_table(conn)
    if not delta:
        return

    with conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO Influence_log (user_id, delta, reason, created_at)
            VALUES (%s, %s, %s, NOW())
            """,
            (int(user_id), int(delta), str(reason or "Изменение очков влияния")[:255]),
        )


def _can_pay_news_reward(rewarded_news_today):
    return int(rewarded_news_today or 0) < NEWS_REWARD_DAILY_LIMIT


def _get_comment_reward_amount(comment_reward_today):
    return COMMENT_REWARD_AMOUNT if int(comment_reward_today or 0) < COMMENT_REWARD_DAILY_LIMIT else 0


def get_daily_rewarded_news_count(conn, team_id):
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM Operation
            WHERE Team = %s
              AND Period = CURDATE()
              AND Comment = %s
            """,
            (team_id, NEWS_REWARD_COMMENT),
        )
        row = cursor.fetchone()
        return int(row["total"] or 0)


def get_daily_comment_reward_total(conn, team_id):
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT COALESCE(SUM(Score), 0) AS total
            FROM Operation
            WHERE Team = %s
              AND Period = CURDATE()
              AND Comment = %s
            """,
            (team_id, COMMENT_REWARD_COMMENT),
        )
        row = cursor.fetchone()
        return int(row["total"] or 0)


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
    normalized_table_name = get_leaderboard_table_name(table_name)

    with conn.cursor() as cursor:
        sql = f"""
            SELECT leaderboard.user_id, leaderboard.name AS Name, leaderboard.score AS Scores
            FROM {normalized_table_name} AS leaderboard
            JOIN users ON users.id = leaderboard.user_id
            WHERE users.isAdmin = b'0' AND users.isJournalist = b'0'
            ORDER BY leaderboard.score DESC, leaderboard.name ASC
        """
        cursor.execute(sql)
        return cursor.fetchall()


def get_influence_logs(conn, limit=200):
    ensure_influence_log_table(conn)

    with conn.cursor() as cursor:
        sql = f"""
            SELECT
                Influence_log.user_id,
                COALESCE(Overall_leader.name, users.login) AS name,
                Influence_log.delta,
                Influence_log.reason,
                Influence_log.created_at
            FROM Influence_log
            LEFT JOIN users ON users.id = Influence_log.user_id
            LEFT JOIN Overall_leader ON Overall_leader.user_id = Influence_log.user_id
            ORDER BY Influence_log.created_at DESC, Influence_log.id DESC
            LIMIT {max(1, int(limit))}
        """
        cursor.execute(sql)
        return cursor.fetchall()


def update_leaderboard_entry(conn, table_name, user_id, name, score):
    normalized_table_name = get_leaderboard_table_name(table_name)
    previous_score = None

    with conn.cursor() as cursor:
        if normalized_table_name == "Overall_leader":
            cursor.execute(
                "SELECT score FROM Overall_leader WHERE user_id = %s LIMIT 1",
                (user_id,),
            )
            row = cursor.fetchone()
            previous_score = int(row["score"] or 0) if row else None

        sql = f"""
            UPDATE {normalized_table_name}
            SET name = %s,
                score = %s
            WHERE user_id = %s
        """
        cursor.execute(sql, (name, score, user_id))
        updated = cursor.rowcount > 0
    if updated and normalized_table_name == "Overall_leader" and previous_score is not None:
        log_influence_change(conn, user_id, int(score) - previous_score, "Ручное изменение администратором")
    conn.commit()
    return updated


def get_news(conn, publication_status=1, author_user_id=None, review_status=None):
    with conn.cursor() as cursor:
        where_conditions = []
        params = []
        if publication_status is not None:
            where_conditions.append("COALESCE(News.is_published, 1) = %s")
            params.append(int(publication_status))
        if author_user_id is not None:
            where_conditions.append("News.user_id = %s")
            params.append(int(author_user_id))
        if review_status is not None:
            where_conditions.append(
                """
                COALESCE(
                    News.review_status,
                    CASE
                        WHEN COALESCE(News.is_published, 1) = 1 THEN %s
                        ELSE %s
                    END
                ) = %s
                """.strip()
            )
            params.extend(
                [
                    NEWS_REVIEW_STATUS_PUBLISHED,
                    NEWS_REVIEW_STATUS_PENDING,
                    review_status,
                ]
            )

        where_clause = f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""

        sql = """
            SELECT
                News.id,
                News.title,
                News.content,
                News.image_path,
                News.video_path,
                News.user_id,
                COALESCE(News.is_published, 1) AS is_published,
                COALESCE(
                    News.review_status,
                    CASE
                        WHEN COALESCE(News.is_published, 1) = 1 THEN %s
                        ELSE %s
                    END
                ) AS review_status,
                COALESCE(News.review_comment, '') AS review_comment,
                News.created_at,
                users.login AS author_name
            FROM News
            JOIN users ON users.id = News.user_id
            {where_clause}
            ORDER BY News.created_at DESC, News.id DESC
        """
        cursor.execute(
            sql.format(where_clause=where_clause),
            (
                NEWS_REVIEW_STATUS_PUBLISHED,
                NEWS_REVIEW_STATUS_PENDING,
                *params,
            ),
        )
        news_rows = cursor.fetchall()

        if not news_rows:
            return []

        news_ids = [int(row["id"]) for row in news_rows]
        placeholders = ", ".join(["%s"] * len(news_ids))

        media_sql = f"""
            SELECT
                News_media.id,
                News_media.news_id,
                News_media.media_path,
                News_media.media_type,
                News_media.sort_order
            FROM News_media
            WHERE News_media.news_id IN ({placeholders})
            ORDER BY News_media.news_id ASC, News_media.sort_order ASC, News_media.id ASC
        """
        cursor.execute(media_sql, news_ids)
        media_rows = cursor.fetchall()

        comment_sql = f"""
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
            WHERE News_comment.news_id IN ({placeholders})
            ORDER BY News_comment.news_id ASC, News_comment.created_at ASC, News_comment.id ASC
        """
        cursor.execute(comment_sql, news_ids)
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
    if is_schema_ready("news_media"):
        return

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

        cursor.execute("SHOW COLUMNS FROM News LIKE 'review_status'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE News
                ADD COLUMN review_status varchar(20) NOT NULL DEFAULT 'published' AFTER is_published
                """
            )
            schema_changed = True

        cursor.execute("SHOW COLUMNS FROM News LIKE 'review_comment'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE News
                ADD COLUMN review_comment text DEFAULT NULL AFTER review_status
                """
            )
            schema_changed = True

        cursor.execute(
            """
            UPDATE News
            SET review_status = CASE
                WHEN COALESCE(is_published, 1) = 1 THEN %s
                ELSE %s
            END
            WHERE review_status IS NULL
               OR review_status = ''
               OR (review_status = %s AND COALESCE(is_published, 1) = 0)
            """,
            (
                NEWS_REVIEW_STATUS_PUBLISHED,
                NEWS_REVIEW_STATUS_PENDING,
                NEWS_REVIEW_STATUS_PUBLISHED,
            ),
        )
        if cursor.rowcount > 0:
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
    mark_schema_ready("news_media")


def ensure_news_comment_columns(conn):
    if is_schema_ready("news_comment"):
        return

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
    mark_schema_ready("news_comment")


def add_news(conn, user_id, title, content, image_path, video_path, media_items=None, is_published=1):
    with conn.cursor() as cursor:
        sql = """
            INSERT INTO News (
                title,
                content,
                image_path,
                video_path,
                user_id,
                is_published,
                review_status,
                review_comment,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, NULL, NOW())
        """
        cursor.execute(
            sql,
            (
                title,
                content,
                image_path,
                video_path,
                user_id,
                int(is_published),
                NEWS_REVIEW_STATUS_PUBLISHED if int(is_published) else NEWS_REVIEW_STATUS_PENDING,
            ),
        )
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
            SELECT
                id,
                user_id,
                title,
                content,
                COALESCE(is_published, 1) AS is_published,
                COALESCE(
                    review_status,
                    CASE
                        WHEN COALESCE(is_published, 1) = 1 THEN %s
                        ELSE %s
                    END
                ) AS review_status,
                COALESCE(review_comment, '') AS review_comment
            FROM News
            WHERE id = %s
            LIMIT 1
        """
        cursor.execute(
            news_sql,
            (
                NEWS_REVIEW_STATUS_PUBLISHED,
                NEWS_REVIEW_STATUS_PENDING,
                news_id,
            ),
        )
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


def update_news(conn, news_id, title, content, media_items, review_status=None, review_comment=None):
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
        update_params = [title, content, image_path, video_path]
        if review_status is not None:
            update_sql = """
                UPDATE News
                SET title = %s,
                    content = %s,
                    image_path = %s,
                    video_path = %s,
                    review_status = %s,
                    review_comment = %s
                WHERE id = %s
            """
            update_params.extend([review_status, review_comment])
        update_params.append(news_id)
        cursor.execute(update_sql, tuple(update_params))

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
              AND COALESCE(review_status, %s) = %s
            """,
            (
                NEWS_REVIEW_STATUS_PENDING,
                NEWS_REVIEW_STATUS_PENDING,
            ),
        )
        row = cursor.fetchone()
        return int(row["total"] or 0)


def publish_news(conn, news_id):
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT News.user_id, Teams.id AS team_id
            FROM News
            LEFT JOIN Teams ON Teams.user_id = News.user_id
            WHERE News.id = %s AND COALESCE(News.is_published, 1) = 0
            LIMIT 1
            """,
            (news_id,),
        )
        news_row = cursor.fetchone()
        if news_row is None:
            return False

        cursor.execute(
            """
            UPDATE News
            SET is_published = 1,
                review_status = %s,
                review_comment = NULL
            WHERE id = %s AND COALESCE(is_published, 1) = 0
            """,
            (NEWS_REVIEW_STATUS_PUBLISHED, news_id),
        )
        updated = cursor.rowcount > 0
        if updated and news_row.get("team_id") is not None:
            team_id = int(news_row["team_id"])
            if _can_pay_news_reward(get_daily_rewarded_news_count(conn, team_id)):
                cursor.execute(
                    """
                    INSERT INTO Operation (Period, Score, Team, Comment)
                    VALUES (CURDATE(), %s, %s, %s)
                    """,
                    (NEWS_REWARD_AMOUNT, team_id, NEWS_REWARD_COMMENT),
                )
            cursor.execute(
                "UPDATE Overall_leader SET score = score + 10 WHERE user_id = %s",
                (int(news_row["user_id"]),),
            )
            log_influence_change(conn, int(news_row["user_id"]), 10, "Публикация новости")
    conn.commit()
    return updated


def reject_news(conn, news_id, review_comment=""):
    with conn.cursor() as cursor:
        cursor.execute(
            """
            UPDATE News
            SET review_status = %s,
                review_comment = %s
            WHERE id = %s AND COALESCE(is_published, 1) = 0
            """,
            (
                NEWS_REVIEW_STATUS_REJECTED,
                review_comment or None,
                news_id,
            ),
        )
        deleted = cursor.rowcount > 0
    conn.commit()
    return deleted


def delete_news(conn, news_id):
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
            WHERE id = %s
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
        team_id = get_current_team_id_by_user_id(conn, user_id)
        if team_id is not None:
            comment_reward = _get_comment_reward_amount(get_daily_comment_reward_total(conn, team_id))
            if comment_reward:
                cursor.execute(
                    """
                    INSERT INTO Operation (Period, Score, Team, Comment)
                    VALUES (CURDATE(), %s, %s, %s)
                    """,
                    (comment_reward, team_id, COMMENT_REWARD_COMMENT),
                )
    conn.commit()
    return True


def ensure_studios_table(conn):
    if is_schema_ready("studios"):
        return

    schema_changed = False
    with conn.cursor() as cursor:
        cursor.execute("SHOW TABLES LIKE 'Studios'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                CREATE TABLE Studios (
                    id int NOT NULL AUTO_INCREMENT,
                    title varchar(255) NOT NULL,
                    description text NOT NULL,
                    image_path varchar(255) DEFAULT NULL,
                    audience varchar(20) NOT NULL DEFAULT 'all',
                    user_id int NOT NULL,
                    created_at datetime NOT NULL,
                    PRIMARY KEY (id),
                    KEY idx_studios_user_id (user_id),
                    KEY idx_studios_created_at (created_at),
                    CONSTRAINT fk_studios_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """
            )
            schema_changed = True
        else:
            required_columns = {
                "title": "ALTER TABLE Studios ADD COLUMN title varchar(255) NOT NULL AFTER id",
                "description": "ALTER TABLE Studios ADD COLUMN description text NOT NULL AFTER title",
                "image_path": "ALTER TABLE Studios ADD COLUMN image_path varchar(255) DEFAULT NULL AFTER description",
                "audience": "ALTER TABLE Studios ADD COLUMN audience varchar(20) NOT NULL DEFAULT 'all' AFTER image_path",
                "user_id": "ALTER TABLE Studios ADD COLUMN user_id int NOT NULL AFTER audience",
                "created_at": "ALTER TABLE Studios ADD COLUMN created_at datetime NOT NULL AFTER user_id",
            }
            for column_name, alter_sql in required_columns.items():
                cursor.execute("SHOW COLUMNS FROM Studios LIKE %s", (column_name,))
                if cursor.fetchone() is None:
                    cursor.execute(alter_sql)
                    schema_changed = True

    if schema_changed:
        conn.commit()
    mark_schema_ready("studios")


def get_studios(conn, viewer_user_id=None, can_manage_all=False):
    with conn.cursor() as cursor:
        sql = """
            SELECT
                Studios.id,
                Studios.title,
                Studios.description,
                Studios.image_path,
                Studios.audience,
                Studios.created_at,
                users.login AS author_name
            FROM Studios
            JOIN users ON users.id = Studios.user_id
        """
        params = ()

        if not can_manage_all:
            audience_filters = ["Studios.audience = 'all'"]
            if viewer_user_id is not None:
                viewer_id = int(viewer_user_id)
                if 6 <= viewer_id <= 9:
                    audience_filters.append("Studios.audience = 'middle'")
                elif 10 <= viewer_id <= 13:
                    audience_filters.append("Studios.audience = 'senior'")
            sql += f" WHERE ({' OR '.join(audience_filters)})"

        sql += " ORDER BY Studios.created_at DESC, Studios.id DESC"
        cursor.execute(sql, params)
        return cursor.fetchall()


def get_studio(conn, studio_id):
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                Studios.id,
                Studios.title,
                Studios.description,
                Studios.image_path,
                Studios.audience,
                Studios.created_at,
                users.login AS author_name
            FROM Studios
            JOIN users ON users.id = Studios.user_id
            WHERE Studios.id = %s
            LIMIT 1
            """,
            (studio_id,),
        )
        return cursor.fetchone()


def add_studio(conn, user_id, title, description, image_path, audience="all"):
    with conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO Studios (title, description, image_path, audience, user_id, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            """,
            (title, description, image_path, audience, user_id),
        )
    conn.commit()
    return True


def update_studio(conn, studio_id, title, description, image_path, audience):
    with conn.cursor() as cursor:
        cursor.execute(
            """
            UPDATE Studios
            SET title = %s,
                description = %s,
                image_path = %s,
                audience = %s
            WHERE id = %s
            """,
            (title, description, image_path, audience, studio_id),
        )
        updated = cursor.rowcount > 0
    conn.commit()
    return updated


def delete_studio(conn, studio_id):
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM Studios WHERE id = %s", (studio_id,))
        deleted = cursor.rowcount > 0
    conn.commit()
    return deleted


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


def ensure_mission_columns(conn):
    if is_schema_ready("mission"):
        return

    schema_changed = False
    with conn.cursor() as cursor:
        cursor.execute("SHOW COLUMNS FROM Mission LIKE 'is_exclusive'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE Mission
                ADD COLUMN is_exclusive tinyint(1) NOT NULL DEFAULT 0 AFTER reward
                """
            )
            schema_changed = True

        cursor.execute("SHOW COLUMNS FROM Mission LIKE 'max_accepted_count'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE Mission
                ADD COLUMN max_accepted_count int NOT NULL DEFAULT 3 AFTER is_exclusive
                """
            )
            schema_changed = True

        cursor.execute("SHOW COLUMNS FROM Mission LIKE 'is_closed'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE Mission
                ADD COLUMN is_closed tinyint(1) NOT NULL DEFAULT 0 AFTER max_accepted_count
                """
            )
            schema_changed = True

        cursor.execute("SHOW COLUMNS FROM Mission LIKE 'is_contract'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE Mission
                ADD COLUMN is_contract tinyint(1) NOT NULL DEFAULT 0 AFTER is_closed
                """
            )
            schema_changed = True

        cursor.execute("SHOW COLUMNS FROM Mission_team LIKE 'bid_reward'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE Mission_team
                ADD COLUMN bid_reward int NULL DEFAULT NULL AFTER status
                """
            )
            schema_changed = True

        cursor.execute("SHOW COLUMNS FROM Mission_team LIKE 'approved_reward'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                ALTER TABLE Mission_team
                ADD COLUMN approved_reward int NULL DEFAULT NULL AFTER bid_reward
                """
            )
            schema_changed = True

    if schema_changed:
        conn.commit()
    mark_schema_ready("mission")


def create_mission(conn, title, description, reward, user_id, is_exclusive=False, max_accepted_count=3, is_contract=False):
    contract_flag = 1 if bool(is_contract) else 0
    normalized_limit = 1 if contract_flag else max(1, int(max_accepted_count or 1))
    normalized_reward = 0 if contract_flag else int(reward or 0)
    exclusive_flag = 1 if bool(is_exclusive) else 0
    with conn.cursor() as cursor:
        sql = """
            INSERT INTO Mission (title, description, reward, is_exclusive, max_accepted_count, is_closed, is_contract, user_id, created_at)
            VALUES (%s, %s, %s, %s, %s, 0, %s, %s, NOW())
        """
        cursor.execute(sql, (title, description, normalized_reward, exclusive_flag, normalized_limit, contract_flag, user_id))
    conn.commit()


def update_mission(conn, mission_id, title, description, reward, is_exclusive=False, max_accepted_count=3, is_contract=False):
    contract_flag = 1 if bool(is_contract) else 0
    normalized_limit = 1 if contract_flag else max(1, int(max_accepted_count or 1))
    normalized_reward = 0 if contract_flag else int(reward or 0)
    exclusive_flag = 1 if bool(is_exclusive) else 0
    with conn.cursor() as cursor:
        select_sql = """
            SELECT id, COALESCE(is_closed, 0) AS is_closed
            FROM Mission
            WHERE id = %s
            LIMIT 1
        """
        cursor.execute(select_sql, (mission_id,))
        row = cursor.fetchone()
        if row is None:
            return False, "Задание не найдено"
        is_closed = int(row.get("is_closed") or 0) if exclusive_flag else 0

        update_sql = """
            UPDATE Mission
            SET title = %s,
                description = %s,
                reward = %s,
                is_exclusive = %s,
                max_accepted_count = %s,
                is_closed = %s,
                is_contract = %s
            WHERE id = %s
        """
        cursor.execute(
            update_sql,
            (title, description, normalized_reward, exclusive_flag, normalized_limit, is_closed, contract_flag, mission_id),
        )

    conn.commit()
    return True, "Задание обновлено"


def get_missions(conn, current_team_id=None):
    with conn.cursor() as cursor:
        missions_sql = """
            SELECT
                Mission.id,
                Mission.title,
                Mission.description,
                Mission.reward,
                COALESCE(Mission.is_exclusive, 0) AS is_exclusive,
                GREATEST(COALESCE(Mission.max_accepted_count, 3), 1) AS max_accepted_count,
                COALESCE(Mission.is_closed, 0) AS is_closed,
                COALESCE(Mission.is_contract, 0) AS is_contract,
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
                Mission_team.bid_reward,
                Mission_team.approved_reward,
                Teams.name AS team_name
            FROM Mission_team
            JOIN Teams ON Teams.id = Mission_team.team_id
            WHERE Mission_team.status IN ('accepted', 'approved')
            ORDER BY Mission_team.accepted_at ASC, Mission_team.id ASC
        """
        cursor.execute(assignments_sql)
        assignments = cursor.fetchall()

        cooldown_mission_ids = set()
        if current_team_id is not None:
            cooldown_sql = """
                SELECT DISTINCT mission_id
                FROM Mission_team
                WHERE team_id = %s
                  AND status = 'approved'
                  AND approved_at IS NOT NULL
                  AND approved_at > (NOW() - INTERVAL 2 DAY)
            """
            cursor.execute(cooldown_sql, (current_team_id,))
            cooldown_mission_ids = {
                int(row["mission_id"])
                for row in cursor.fetchall()
            }

    assignments_by_mission = {}
    active_count_by_team = {}

    for assignment in assignments:
        mission_id = int(assignment["mission_id"])
        team_id = int(assignment["team_id"])
        assignments_by_mission.setdefault(mission_id, []).append(assignment)
        if assignment["status"] == "accepted":
            active_count_by_team[team_id] = active_count_by_team.get(team_id, 0) + 1

    result = []
    for mission in missions:
        mission_id = int(mission["id"])
        if mission_id in cooldown_mission_ids:
            continue
        mission_assignments = assignments_by_mission.get(mission_id, [])
        pending_assignments = [item for item in mission_assignments if item["status"] == "accepted"]
        approved_assignments = [item for item in mission_assignments if item["status"] == "approved"]
        mission["accepted_count"] = len(pending_assignments)
        mission["accepted_teams"] = [item["team_name"] for item in pending_assignments]
        mission["is_exclusive"] = bool(int(mission.get("is_exclusive") or 0))
        mission["is_contract"] = bool(int(mission.get("is_contract") or 0))
        mission["max_accepted_count"] = max(1, int(mission.get("max_accepted_count") or 3))
        mission["is_closed"] = bool(int(mission.get("is_closed") or 0))
        mission["awarded_team_name"] = approved_assignments[0]["team_name"] if approved_assignments else None
        mission["user_has_taken"] = any(
            int(item["team_id"]) == int(current_team_id)
            for item in pending_assignments
        ) if current_team_id is not None else False
        mission["current_bid_reward"] = next(
            (
                int(item["bid_reward"] or 0)
                for item in pending_assignments
                if current_team_id is not None and int(item["team_id"]) == int(current_team_id)
            ),
            None,
        )
        result.append(mission)

    team_active_count = active_count_by_team.get(int(current_team_id), 0) if current_team_id is not None else 0
    return result, team_active_count


def accept_mission(conn, mission_id, team_id, bid_reward=None):
    with conn.cursor() as cursor:
        mission_sql = """
            SELECT
                id,
                COALESCE(is_closed, 0) AS is_closed,
                COALESCE(is_contract, 0) AS is_contract,
                GREATEST(COALESCE(max_accepted_count, 3), 1) AS max_accepted_count
            FROM Mission
            WHERE id = %s
            LIMIT 1
        """
        cursor.execute(mission_sql, (mission_id,))
        mission_row = cursor.fetchone()
        if mission_row is None:
            return False, "Задание не найдено"
        if int(mission_row.get("is_closed") or 0) == 1:
            return False, "Задание уже закрыто"

        cooldown_sql = """
            SELECT id
            FROM Mission_team
            WHERE mission_id = %s
              AND team_id = %s
              AND status = 'approved'
              AND approved_at IS NOT NULL
              AND approved_at > (NOW() - INTERVAL 2 DAY)
            LIMIT 1
        """
        cursor.execute(cooldown_sql, (mission_id, team_id))
        if cursor.fetchone():
            return False, "Это задание снова станет доступно для вашего Легиона через 2 дня"

        same_mission_sql = """
            SELECT id, bid_reward
            FROM Mission_team
            WHERE mission_id = %s
              AND team_id = %s
              AND status = 'accepted'
            LIMIT 1
        """
        cursor.execute(same_mission_sql, (mission_id, team_id))
        existing_assignment = cursor.fetchone()
        if existing_assignment:
            if int(mission_row.get("is_contract") or 0) == 1:
                if bid_reward is None:
                    return False, "Укажите цену для контракта"
                normalized_bid_reward = int(bid_reward)
                if normalized_bid_reward < 0:
                    return False, "Укажите корректную цену для контракта"
                cursor.execute(
                    "UPDATE Mission_team SET bid_reward = %s WHERE id = %s",
                    (normalized_bid_reward, int(existing_assignment["id"])),
                )
                conn.commit()
                return True, "Цена контракта обновлена"
            return False, "Задание уже выбрано вашим Легионом"

        mission_count_sql = """
            SELECT COUNT(*) AS total
            FROM Mission_team
            WHERE mission_id = %s AND status = 'accepted'
        """
        cursor.execute(mission_count_sql, (mission_id,))
        mission_count = int(cursor.fetchone()["total"] or 0)
        mission_limit = max(1, int(mission_row.get("max_accepted_count") or 3))
        is_contract = int(mission_row.get("is_contract") or 0) == 1
        if not is_contract and mission_count >= mission_limit:
            return False, f"На это задание уже откликнулись {mission_limit} отряда"

        team_count_sql = """
            SELECT COUNT(*) AS total
            FROM Mission_team
            WHERE team_id = %s AND status = 'accepted'
        """
        cursor.execute(team_count_sql, (team_id,))
        team_count = int(cursor.fetchone()["total"] or 0)
        if team_count >= 3:
            return False, "Отряд уже взял максимальные 3 задания"

        normalized_bid_reward = None
        if is_contract:
            if bid_reward is None:
                return False, "Укажите цену для контракта"
            normalized_bid_reward = int(bid_reward)
            if normalized_bid_reward < 0:
                return False, "Укажите корректную цену для контракта"

        insert_sql = """
            INSERT INTO Mission_team (mission_id, team_id, status, bid_reward, accepted_at)
            VALUES (%s, %s, 'accepted', %s, NOW())
        """
        cursor.execute(insert_sql, (mission_id, team_id, normalized_bid_reward))

    conn.commit()
    return True, "Отклик на контракт отправлен" if is_contract else "Задание принято"


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
                COALESCE(Mission.title, CONCAT('Задание #', Mission_team.mission_id)) AS title,
                COALESCE(Mission.description, '') AS description,
                COALESCE(Mission.reward, 0) AS reward,
                COALESCE(Mission.is_contract, 0) AS is_contract,
                Mission_team.accepted_at,
                Mission_team.bid_reward,
                COALESCE(Teams.name, CONCAT('Легион #', Mission_team.team_id)) AS team_name
            FROM Mission_team
            LEFT JOIN Mission ON Mission.id = Mission_team.mission_id
            LEFT JOIN Teams ON Teams.id = Mission_team.team_id
            WHERE Mission_team.status = 'accepted'
            ORDER BY Mission_team.accepted_at ASC, Mission_team.id ASC
        """
        cursor.execute(sql)
        return cursor.fetchall()


def approve_mission(conn, assignment_id, admin_user_id, approved_reward=None):
    with conn.cursor() as cursor:
        select_sql = """
            SELECT
                Mission_team.id,
                Mission_team.team_id,
                Mission_team.mission_id,
                Mission.title,
                Mission.reward,
                Mission_team.bid_reward,
                Teams.user_id,
                Teams.name AS team_name,
                COALESCE(Mission.is_exclusive, 0) AS is_exclusive,
                COALESCE(Mission.is_contract, 0) AS is_contract,
                GREATEST(COALESCE(Mission.max_accepted_count, 3), 1) AS max_accepted_count
            FROM Mission_team
            JOIN Mission ON Mission.id = Mission_team.mission_id
            JOIN Teams ON Teams.id = Mission_team.team_id
            WHERE Mission_team.id = %s AND Mission_team.status = 'accepted'
            LIMIT 1
        """
        cursor.execute(select_sql, (assignment_id,))
        row = cursor.fetchone()
        if row is None:
            return False, "Задание не найдено или уже обработано"

        reward = int(row["reward"] or 0)
        team_id = int(row["team_id"])
        team_user_id = int(row["user_id"])
        mission_id = int(row["mission_id"])
        mission_title = row["title"]
        team_name = row["team_name"]
        is_contract = int(row.get("is_contract") or 0) == 1
        payout_reward = 0 if is_contract else int(approved_reward if approved_reward is not None else reward)

        if not is_contract:
            operation_sql = """
                INSERT INTO Operation (Period, Score, Team, Comment)
                VALUES (CURDATE(), %s, %s, %s)
            """
            cursor.execute(
                operation_sql,
                (payout_reward, team_id, f"Награда за выполнение задания: {mission_title}"),
            )

        update_sql = """
            UPDATE Mission_team
            SET status = 'approved', approved_reward = %s, approved_at = NOW(), approved_by = %s
            WHERE id = %s
        """
        cursor.execute(update_sql, (None if is_contract else payout_reward, admin_user_id, assignment_id))

        if not is_contract:
            cursor.execute(
                "UPDATE Overall_leader SET score = score + 10 WHERE user_id = %s",
                (team_user_id,),
            )
            log_influence_change(conn, team_user_id, 10, f"Выполнение задания: {mission_title}")
        else:
            cursor.execute(
                """
                UPDATE Mission_team
                SET status = 'rejected', rejected_at = NOW(), rejected_by = %s
                WHERE mission_id = %s AND id <> %s AND status = 'accepted'
                """,
                (admin_user_id, mission_id, assignment_id),
            )
            cursor.execute("UPDATE Mission SET is_closed = 1 WHERE id = %s", (mission_id,))
            conn.commit()
            return True, f"Контракт передан легиону {team_name}"

        if int(row.get("is_exclusive") or 0) == 1:
            approved_count_sql = """
                SELECT COUNT(*) AS total
                FROM Mission_team
                WHERE mission_id = %s AND status = 'approved'
            """
            cursor.execute(approved_count_sql, (mission_id,))
            approved_count = int(cursor.fetchone()["total"] or 0)
            max_accepted_count = max(1, int(row.get("max_accepted_count") or 1))
            if approved_count >= max_accepted_count:
                cursor.execute("UPDATE Mission SET is_closed = 1 WHERE id = %s", (mission_id,))

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
