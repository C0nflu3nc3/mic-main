import os

from flask import Flask, flash, redirect, render_template, request, send_from_directory, session, url_for

from api.add_operation import create_transfer
from api.functions import (
    add_news,
    add_news_comment,
    accept_mission,
    approve_mission,
    cancel_mission,
    create_mission,
    delete_mission,
    get_approve_queue,
    get_current_team_id_by_user_id,
    get_leaderboard_table,
    get_missions,
    get_news,
    get_operations,
    get_plt,
    get_scoreboard,
    get_teams_for_select,
    reject_mission,
)
from helper.connect import get_connection
from helper.logout import logout_user
from helper.signin import sign_in_user

app = Flask(__name__, template_folder="pages", static_folder="static")
app.secret_key = "super_secret_key_change_me"
app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, "uploads", "news")
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)


def require_user():
    user = session.get("user")
    if not user:
        return None, redirect(url_for("index"))
    return user, None


def can_manage_news(user):
    return bool(user["isadmin"]) or bool(user.get("isjournalist"))


def can_take_missions(user):
    return not bool(user["isadmin"]) and not bool(user.get("isjournalist"))


def is_allowed_image(filename):
    if not filename or "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].lower()
    return extension in ALLOWED_IMAGE_EXTENSIONS


def save_news_image(uploaded_file):
    if uploaded_file is None or uploaded_file.filename == "":
        return None
    if not is_allowed_image(uploaded_file.filename):
        return None

    filename = uploaded_file.filename.rsplit("/", 1)[-1].rsplit("\\", 1)[-1].strip()
    if not filename or not is_allowed_image(filename):
        return None

    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    uploaded_file.save(file_path)
    return f"uploads/news/{filename}"


@app.route("/css/<path:filename>")
def css_files(filename):
    return send_from_directory("css", filename)


@app.route("/js/<path:filename>")
def js_files(filename):
    return send_from_directory("js", filename)


@app.route("/uploads/<path:filename>")
def uploaded_files(filename):
    return send_from_directory(os.path.join(app.root_path, "uploads"), filename)


@app.route("/favicon.ico")
def favicon():
    return send_from_directory("static", "favicon.ico")


@app.route("/favicon_old.ico")
def favicon_old():
    return send_from_directory("static", "favicon_old.ico")


@app.route("/", methods=["GET"])
def index():
    if session.get("user"):
        return redirect(url_for("home_page"))
    return render_template("login.html")


@app.route("/signin", methods=["POST"])
def signin():
    login = request.form.get("login", "").strip()
    password = request.form.get("password", "").strip()

    ok, message = sign_in_user(login, password, session)
    if ok:
        return redirect(url_for("home_page"))

    flash(message)
    return redirect(url_for("index"))


@app.route("/logout", methods=["GET"])
def logout():
    logout_user(session)
    return redirect(url_for("index"))


@app.route("/home", methods=["GET"])
def home_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    return render_template(
        "home.html",
        user=user,
        is_admin=bool(user["isadmin"]),
        active_section="home",
    )


@app.route("/leaderboard", methods=["GET"])
def leaderboard_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    conn = get_connection()
    try:
        overall_leaderboard = get_leaderboard_table(conn, "Overall_leader")
        duel_leaderboard = get_leaderboard_table(conn, "Duel_leader")
    finally:
        conn.close()

    return render_template(
        "leaderboard.html",
        user=user,
        is_admin=bool(user["isadmin"]),
        active_section="home",
        overall_leaderboard=overall_leaderboard,
        duel_leaderboard=duel_leaderboard,
    )


@app.route("/news", methods=["GET"])
def news_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    conn = get_connection()
    try:
        news_items = get_news(conn)
    finally:
        conn.close()

    return render_template(
        "news.html",
        user=user,
        is_admin=bool(user["isadmin"]),
        can_manage_news=can_manage_news(user),
        active_section="home",
        news_items=news_items,
    )


@app.route("/news/add", methods=["POST"])
def add_news_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_manage_news(user):
        return redirect(url_for("news_page"))

    title = request.form.get("title", "").strip()
    content = request.form.get("content", "").strip()
    image = request.files.get("image")

    if not title or not content:
        flash("Заполните заголовок и текст новости")
        return redirect(url_for("news_page"))

    image_path = save_news_image(image)
    if image is not None and image.filename and image_path is None:
        flash("Разрешены только изображения png, jpg, jpeg, gif, webp")
        return redirect(url_for("news_page"))

    conn = get_connection()
    try:
        add_news(conn, int(user["id"]), title, content, image_path)
    finally:
        conn.close()

    flash("Новость добавлена")
    return redirect(url_for("news_page"))


@app.route("/news/comment", methods=["POST"])
def add_news_comment_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    news_id = request.form.get("news_id", "").strip()
    comment = request.form.get("comment", "").strip()

    if not news_id.isdigit() or not comment:
        flash("Комментарий не добавлен")
        return redirect(url_for("news_page"))

    conn = get_connection()
    try:
        ok = add_news_comment(conn, int(news_id), int(user["id"]), comment)
    finally:
        conn.close()

    flash("Комментарий добавлен" if ok else "Новость не найдена")
    return redirect(url_for("news_page"))


@app.route("/missions", methods=["GET"])
def missions_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    is_admin = bool(user["isadmin"])
    current_team_id = user.get("team_id")

    conn = get_connection()
    try:
        if current_team_id is None:
            current_team_id = get_current_team_id_by_user_id(conn, int(user["id"]))
            user["team_id"] = current_team_id
            session["user"] = user
        missions, current_team_mission_count = get_missions(conn, current_team_id)
    finally:
        conn.close()

    return render_template(
        "missions.html",
        user=user,
        is_admin=is_admin,
        can_take_missions=can_take_missions(user),
        active_section="home",
        missions=missions,
        current_team_id=current_team_id,
        current_team_mission_count=current_team_mission_count,
    )


@app.route("/missions/add", methods=["POST"])
def add_mission_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not bool(user["isadmin"]):
        return redirect(url_for("missions_page"))

    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    reward = request.form.get("reward", "").strip()

    if not title or not description or not reward.isdigit() or int(reward) <= 0:
        flash("Введите корректные данные задания и награды")
        return redirect(url_for("missions_page"))

    conn = get_connection()
    try:
        create_mission(conn, title, description, int(reward), int(user["id"]))
    finally:
        conn.close()

    flash("Задание опубликовано")
    return redirect(url_for("missions_page"))


@app.route("/missions/accept", methods=["POST"])
def accept_mission_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_take_missions(user):
        return redirect(url_for("missions_page"))

    mission_id = request.form.get("mission_id", "").strip()
    current_team_id = user.get("team_id")

    if not mission_id.isdigit() or current_team_id is None:
        flash("Не удалось принять задание")
        return redirect(url_for("missions_page"))

    conn = get_connection()
    try:
        ok, message = accept_mission(conn, int(mission_id), int(current_team_id))
    finally:
        conn.close()

    flash(message)
    return redirect(url_for("missions_page"))


@app.route("/missions/cancel", methods=["POST"])
def cancel_mission_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_take_missions(user):
        return redirect(url_for("missions_page"))

    mission_id = request.form.get("mission_id", "").strip()
    current_team_id = user.get("team_id")

    conn = get_connection()
    try:
        if current_team_id is None:
            current_team_id = get_current_team_id_by_user_id(conn, int(user["id"]))
            user["team_id"] = current_team_id
            session["user"] = user

        if not mission_id.isdigit() or current_team_id is None:
            flash("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u0430\u0437\u0430\u0442\u044c\u0441\u044f \u043e\u0442 \u0437\u0430\u0434\u0430\u043d\u0438\u044f")
            return redirect(url_for("missions_page"))

        ok, message = cancel_mission(conn, int(mission_id), int(current_team_id))
    finally:
        conn.close()

    flash(message)
    return redirect(url_for("missions_page"))


@app.route("/missions/delete", methods=["POST"])
def delete_mission_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not bool(user["isadmin"]):
        return redirect(url_for("missions_page"))

    mission_id = request.form.get("mission_id", "").strip()
    if not mission_id.isdigit():
        flash("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0437\u0430\u0434\u0430\u043d\u0438\u0435")
        return redirect(url_for("missions_page"))

    conn = get_connection()
    try:
        ok, message = delete_mission(conn, int(mission_id))
    finally:
        conn.close()

    flash(message)
    return redirect(url_for("missions_page"))


@app.route("/teams", methods=["GET"])
def teams_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    is_admin = bool(user["isadmin"])
    current_team_id = user.get("team_id")

    conn = get_connection()
    try:
        if current_team_id is None:
            current_team_id = get_current_team_id_by_user_id(conn, int(user["id"]))
            user["team_id"] = current_team_id
            session["user"] = user

        current_plt = get_plt(conn, current_team_id) if current_team_id is not None else 0
        scoreboard = get_scoreboard(conn)
        operations = get_operations(conn, is_admin, current_team_id)
        teams_for_select = get_teams_for_select(conn, is_admin, current_team_id)
    finally:
        conn.close()

    return render_template(
        "teams.html",
        user=user,
        is_admin=is_admin,
        active_section="bank",
        current_team_id=current_team_id,
        current_plt=current_plt,
        scoreboard=scoreboard,
        operations=operations,
        teams_for_select=teams_for_select,
    )


@app.route("/studios", methods=["GET"])
def studios_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    return render_template(
        "section-placeholder.html",
        user=user,
        is_admin=bool(user["isadmin"]),
        active_section="studios",
        section_title="Студии",
        section_description="Здесь размещается полное описание студий с картинками и разбивкой по тематическим блокам.",
    )


@app.route("/history", methods=["GET"])
def history_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    return render_template(
        "section-placeholder.html",
        user=user,
        is_admin=bool(user["isadmin"]),
        active_section="history",
        section_title="История",
        section_description="Здесь собраны энциклопедия программы, лор империи и информация о главных персонажах.",
    )


@app.route("/bonus", methods=["GET"])
def bonus_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    return render_template(
        "section-placeholder.html",
        user=user,
        is_admin=bool(user["isadmin"]),
        active_section="bonus",
        section_title="Бонусная система",
        section_description="Здесь собраны правила, игры и возможности заработка внутри бонусной системы.",
    )


@app.route("/approve", methods=["GET"])
def approve_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not bool(user["isadmin"]):
        return redirect(url_for("home_page"))

    conn = get_connection()
    try:
        approve_items = get_approve_queue(conn)
    finally:
        conn.close()

    return render_template(
        "approve.html",
        user=user,
        is_admin=True,
        active_section="approve",
        approve_items=approve_items,
    )


@app.route("/approve/confirm", methods=["POST"])
def approve_confirm_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not bool(user["isadmin"]):
        return redirect(url_for("home_page"))

    assignment_id = request.form.get("assignment_id", "").strip()
    if not assignment_id.isdigit():
        flash("Не удалось подтвердить выполнение")
        return redirect(url_for("approve_page"))

    conn = get_connection()
    try:
        ok, message = approve_mission(conn, int(assignment_id), int(user["id"]))
    finally:
        conn.close()

    flash(message)
    return redirect(url_for("approve_page"))


@app.route("/approve/reject", methods=["POST"])
def approve_reject_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not bool(user["isadmin"]):
        return redirect(url_for("home_page"))

    assignment_id = request.form.get("assignment_id", "").strip()
    if not assignment_id.isdigit():
        flash("Не удалось отклонить выполнение")
        return redirect(url_for("approve_page"))

    conn = get_connection()
    try:
        ok, message = reject_mission(conn, int(assignment_id), int(user["id"]))
    finally:
        conn.close()

    flash(message)
    return redirect(url_for("approve_page"))


@app.route("/api/get_users", methods=["GET"])
def api_get_users():
    user = session.get("user")
    if not user:
        return {"error": "Unauthorized"}, 401

    is_admin = bool(user["isadmin"])
    current_team_id = user.get("team_id")

    conn = get_connection()
    try:
        if current_team_id is None:
            current_team_id = get_current_team_id_by_user_id(conn, int(user["id"]))
        teams = get_teams_for_select(conn, is_admin, current_team_id)
    finally:
        conn.close()

    return {"teams": teams}


@app.route("/api/add_operation", methods=["POST"])
def api_add_operation():
    user = session.get("user")
    if not user:
        return redirect(url_for("index"))

    is_admin = bool(user["isadmin"])
    current_team_id = user.get("team_id")

    parent = request.form.get("parent", "").strip()
    target = request.form.get("user", "").strip()
    score = request.form.get("score", "").strip()
    comment = request.form.get("comment", "").strip()

    conn = get_connection()
    try:
        if current_team_id is None:
            current_team_id = get_current_team_id_by_user_id(conn, int(user["id"]))

        ok, message = create_transfer(
            conn=conn,
            is_admin=is_admin,
            current_user_id=current_team_id,
            parent=parent,
            target=target,
            score=score,
            comment=comment,
        )
    finally:
        conn.close()

    flash(message)
    return redirect(url_for("teams_page"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
