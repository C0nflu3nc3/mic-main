import json
import os
import shutil
from datetime import date, datetime

from flask import Flask, flash, get_flashed_messages, redirect, render_template, request, send_from_directory, session, url_for
from werkzeug.utils import secure_filename

from api.add_operation import create_transfer
from api.functions import (
    add_news,
    add_news_comment,
    accept_mission,
    approve_mission,
    delete_news_comment,
    cancel_mission,
    create_mission,
    delete_mission,
    get_approve_queue,
    get_current_team_id_by_user_id,
    get_leaderboard_table,
    get_news_for_update,
    get_missions,
    get_news,
    get_operations,
    get_plt,
    get_scoreboard,
    get_teams_for_select,
    ensure_news_comment_columns,
    ensure_news_media_columns,
    reject_mission,
    update_news,
)
from helper.connect import get_connection
from helper.logout import logout_user
from helper.signin import sign_in_user

app = Flask(__name__, template_folder="pages", static_folder="static")
app.secret_key = "super_secret_key_change_me"

default_upload_root = os.path.join(app.root_path, "uploads")
persistent_upload_root = (
    os.getenv("UPLOAD_ROOT")
    or os.getenv("RAILWAY_VOLUME_MOUNT_PATH")
    or default_upload_root
)
legacy_upload_folder = os.path.join(default_upload_root, "news")

app.config["UPLOAD_ROOT"] = persistent_upload_root
app.config["UPLOAD_FOLDER"] = os.path.join(persistent_upload_root, "news")
app.config["LEGACY_UPLOAD_FOLDER"] = legacy_upload_folder
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
ALLOWED_VIDEO_EXTENSIONS = {"mp4", "webm", "ogg", "mov", "m4v"}
os.makedirs(app.config["UPLOAD_ROOT"], exist_ok=True)
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)


def bootstrap_news_uploads():
    source_dir = app.config["LEGACY_UPLOAD_FOLDER"]
    target_dir = app.config["UPLOAD_FOLDER"]

    if os.path.abspath(source_dir) == os.path.abspath(target_dir):
        return
    if not os.path.isdir(source_dir):
        return

    for entry in os.scandir(source_dir):
        if not entry.is_file():
            continue
        target_path = os.path.join(target_dir, entry.name)
        if os.path.exists(target_path):
            continue
        shutil.copy2(entry.path, target_path)


bootstrap_news_uploads()


def serialize_for_react(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: serialize_for_react(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [serialize_for_react(item) for item in value]
    return value


FRONTEND_MANIFEST_PATH = os.path.join(app.static_folder, "frontend", ".vite", "manifest.json")


def get_frontend_assets():
    if not os.path.exists(FRONTEND_MANIFEST_PATH):
        return None

    try:
        with open(FRONTEND_MANIFEST_PATH, "r", encoding="utf-8") as manifest_file:
            manifest = json.load(manifest_file)
    except (OSError, json.JSONDecodeError):
        return None

    entry = manifest.get("index.html")
    if entry is None:
        entry = next((item for item in manifest.values() if item.get("isEntry")), None)
    if entry is None:
        return None

    return {
        "js": f"frontend/{entry['file']}",
        "css": [f"frontend/{css_file}" for css_file in entry.get("css", [])],
    }


def render_react_page(page, page_title, user=None, active_section=None, **page_data):
    bootstrap = {
        "page": page,
        "pageTitle": page_title,
        "activeSection": active_section,
        "user": serialize_for_react(user) if user else None,
        "messages": get_flashed_messages(),
    }
    bootstrap.update(serialize_for_react(page_data))
    return render_template(
        "react-shell.html",
        bootstrap=bootstrap,
        page_title=page_title,
        frontend_assets=get_frontend_assets(),
    )


def require_user():
    user = session.get("user")
    if not user:
        return None, redirect(url_for("index"))
    return user, None


def can_manage_news(user):
    return bool(user["isadmin"]) or bool(user.get("isjournalist"))


def can_take_missions(user):
    return not bool(user["isadmin"]) and not bool(user.get("isjournalist"))


def is_allowed_extension(filename, allowed_extensions):
    if not filename or "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].lower()
    return extension in allowed_extensions


def is_allowed_image(filename):
    return is_allowed_extension(filename, ALLOWED_IMAGE_EXTENSIONS)


def is_allowed_video(filename):
    return is_allowed_extension(filename, ALLOWED_VIDEO_EXTENSIONS)


def get_news_media_type(filename):
    if is_allowed_image(filename):
        return "image"
    if is_allowed_video(filename):
        return "video"
    return None


def save_news_media(uploaded_file, allowed_extensions, fallback_base_name):
    if uploaded_file is None or uploaded_file.filename == "":
        return None
    if not is_allowed_extension(uploaded_file.filename, allowed_extensions):
        return None

    raw_filename = uploaded_file.filename.rsplit("/", 1)[-1].rsplit("\\", 1)[-1].strip()
    if not raw_filename or not is_allowed_extension(raw_filename, allowed_extensions):
        return None

    base_name, extension = os.path.splitext(raw_filename)
    safe_base_name = secure_filename(base_name).strip("._-")
    if not safe_base_name:
        safe_base_name = fallback_base_name

    extension = extension.lower()
    filename = f"{safe_base_name}{extension}"
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    suffix = 2
    while os.path.exists(file_path):
        filename = f"{safe_base_name}-{suffix}{extension}"
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        suffix += 1

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    uploaded_file.save(file_path)
    return f"uploads/news/{filename}"


def save_news_image(uploaded_file):
    return save_news_media(uploaded_file, ALLOWED_IMAGE_EXTENSIONS, "news-image")


def save_news_video(uploaded_file):
    return save_news_media(uploaded_file, ALLOWED_VIDEO_EXTENSIONS, "news-video")


def collect_news_media_files(uploaded_files):
    prepared_files = []

    for uploaded_file in uploaded_files:
        if uploaded_file is None or uploaded_file.filename == "":
            continue

        media_type = get_news_media_type(uploaded_file.filename)
        if media_type is None:
            return None, "Р Р°Р·СЂРµС€РµРЅС‹ С‚РѕР»СЊРєРѕ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ png, jpg, jpeg, gif, webp Рё РІРёРґРµРѕ mp4, webm, ogg, mov, m4v"

        prepared_files.append((uploaded_file, media_type))

    if len(prepared_files) > 3:
        return None, "РњРѕР¶РЅРѕ РґРѕР±Р°РІРёС‚СЊ РЅРµ Р±РѕР»РµРµ 3 РјРµРґРёР°С„Р°Р№Р»РѕРІ"

    saved_media = []
    for sort_order, (uploaded_file, media_type) in enumerate(prepared_files):
        if media_type == "image":
            media_path = save_news_image(uploaded_file)
        else:
            media_path = save_news_video(uploaded_file)

        if media_path is None:
            return None, "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РѕРґРёРЅ РёР· РјРµРґРёР°С„Р°Р№Р»РѕРІ"

        saved_media.append(
            {
                "media_path": media_path,
                "media_type": media_type,
                "sort_order": sort_order,
            }
        )

    return saved_media, None


def build_updated_news_media(existing_media, removed_media_ids, new_media_items):
    kept_media = [
        {
            "media_path": item["media_path"],
            "media_type": item["media_type"],
        }
        for item in existing_media
        if int(item["id"]) not in removed_media_ids
    ]

    if len(kept_media) + len(new_media_items) > 3:
        return None, "РњРѕР¶РЅРѕ РѕСЃС‚Р°РІРёС‚СЊ РЅРµ Р±РѕР»РµРµ 3 РјРµРґРёР°С„Р°Р№Р»РѕРІ"

    final_media = []
    for item in kept_media + new_media_items:
        final_media.append(
            {
                "media_path": item["media_path"],
                "media_type": item["media_type"],
                "sort_order": len(final_media),
            }
        )

    return final_media, None


@app.route("/css/<path:filename>")
def css_files(filename):
    return send_from_directory("css", filename)


@app.route("/js/<path:filename>")
def js_files(filename):
    return send_from_directory("js", filename)


@app.route("/uploads/<path:filename>")
def uploaded_files(filename):
    return send_from_directory(app.config["UPLOAD_ROOT"], filename)


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
    return render_react_page("login", "Авторизация")


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

    return render_react_page("home", "Главная страница", user=user, active_section="home")


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

    return render_react_page(
        "leaderboard",
        "Таблица лидеров",
        user=user,
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
        ensure_news_comment_columns(conn)
        ensure_news_media_columns(conn)
        news_items = get_news(conn)
    finally:
        conn.close()

    return render_react_page(
        "news",
        "Новости",
        user=user,
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
    media_files = request.files.getlist("media")

    if not title or not content:
        flash("\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0437\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a \u0438 \u0442\u0435\u043a\u0441\u0442 \u043d\u043e\u0432\u043e\u0441\u0442\u0438")
        return redirect(url_for("news_page"))

    if not media_files:
        media_files = [
            request.files.get("image"),
            request.files.get("video"),
        ]

    media_items, media_error = collect_news_media_files(media_files)
    if media_error:
        flash(media_error)
        return redirect(url_for("news_page"))

    image_path = next((item["media_path"] for item in media_items if item["media_type"] == "image"), None)
    video_path = next((item["media_path"] for item in media_items if item["media_type"] == "video"), None)

    conn = get_connection()
    try:
        ensure_news_media_columns(conn)
        add_news(conn, int(user["id"]), title, content, image_path, video_path, media_items)
    finally:
        conn.close()

    flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0430")
    return redirect(url_for("news_page"))

    image = request.files.get("image")
    video = request.files.get("video")

    if not title or not content:
        flash("\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0437\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a \u0438 \u0442\u0435\u043a\u0441\u0442 \u043d\u043e\u0432\u043e\u0441\u0442\u0438")
        return redirect(url_for("news_page"))

    image_path = save_news_image(image)
    if image is not None and image.filename and image_path is None:
        flash("\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u044b \u0442\u043e\u043b\u044c\u043a\u043e \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f png, jpg, jpeg, gif, webp")
        return redirect(url_for("news_page"))

    if video is not None and video.filename and not is_allowed_video(video.filename):
        flash("\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u044b \u0442\u043e\u043b\u044c\u043a\u043e \u0432\u0438\u0434\u0435\u043e mp4, webm, ogg, mov, m4v")
        return redirect(url_for("news_page"))

    video_path = save_news_video(video)
    if False and video is not None and video.filename and video_path is None:
        flash("\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u044b \u0442\u043e\u043b\u044c\u043a\u043e \u0432\u0438\u0434\u0435\u043e mp4, webm, ogg, mov, m4v")
        return redirect(url_for("news_page"))

    conn = get_connection()
    try:
        ensure_news_media_columns(conn)
        add_news(conn, int(user["id"]), title, content, image_path, video_path)
    finally:
        conn.close()

    flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0430")
    return redirect(url_for("news_page"))


@app.route("/news/update", methods=["POST"])
def update_news_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_manage_news(user):
        return redirect(url_for("news_page"))

    news_id = request.form.get("news_id", "").strip()
    title = request.form.get("title", "").strip()
    content = request.form.get("content", "").strip()
    remove_media_ids_raw = request.form.getlist("remove_media_ids")
    media_files = request.files.getlist("media")

    if not news_id.isdigit() or not title or not content:
        flash("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043d\u043e\u0432\u043e\u0441\u0442\u044c")
        return redirect(url_for("news_page"))

    removed_media_ids = {
        int(media_id)
        for media_id in remove_media_ids_raw
        if media_id.isdigit()
    }

    new_media_items, media_error = collect_news_media_files(media_files)
    if media_error:
        flash(media_error)
        return redirect(url_for("news_page"))

    conn = get_connection()
    try:
        ensure_news_media_columns(conn)
        news_item = get_news_for_update(conn, int(news_id))
        if news_item is None:
            flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430")
            return redirect(url_for("news_page"))

        final_media, final_media_error = build_updated_news_media(
            news_item["media"],
            removed_media_ids,
            new_media_items,
        )
        if final_media_error:
            flash(final_media_error)
            return redirect(url_for("news_page"))

        update_news(conn, int(news_id), title, content, final_media)
    finally:
        conn.close()

    flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0430")
    return redirect(url_for("news_page"))


@app.route("/news/comment", methods=["POST"])
def add_news_comment_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    news_id = request.form.get("news_id", "").strip()
    comment = request.form.get("comment", "").strip()
    parent_comment_id = request.form.get("parent_comment_id", "").strip()

    if not news_id.isdigit() or not comment:
        flash("\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d")
        return redirect(url_for("news_page"))

    parent_comment_id_value = int(parent_comment_id) if parent_comment_id.isdigit() else None

    conn = get_connection()
    try:
        ensure_news_comment_columns(conn)
        ok = add_news_comment(
            conn,
            int(news_id),
            int(user["id"]),
            comment,
            parent_comment_id_value,
        )
    finally:
        conn.close()

    flash(
        "\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d"
        if ok
        else "\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d"
    )
    return redirect(url_for("news_page"))


@app.route("/news/comment/delete", methods=["POST"])
def delete_news_comment_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    comment_id = request.form.get("comment_id", "").strip()
    if not comment_id.isdigit():
        flash("\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439 \u043d\u0435 \u0443\u0434\u0430\u043b\u0451\u043d")
        return redirect(url_for("news_page"))

    conn = get_connection()
    try:
        ensure_news_comment_columns(conn)
        ok, message = delete_news_comment(
            conn,
            int(comment_id),
            int(user["id"]),
            can_manage_news(user),
        )
    finally:
        conn.close()

    flash(message)
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

    return render_react_page(
        "missions",
        "Миссии за валюту",
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
        flash("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u0437\u0430\u0434\u0430\u043d\u0438\u044f \u0438 \u043d\u0430\u0433\u0440\u0430\u0434\u044b")
        return redirect(url_for("missions_page"))

    conn = get_connection()
    try:
        create_mission(conn, title, description, int(reward), int(user["id"]))
    finally:
        conn.close()

    flash("\u0417\u0430\u0434\u0430\u043d\u0438\u0435 \u043e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u043e")
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
        flash("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0440\u0438\u043d\u044f\u0442\u044c \u0437\u0430\u0434\u0430\u043d\u0438\u0435")
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

    return render_react_page(
        "teams",
        "Банк",
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

    return render_react_page(
        "placeholder",
        "Студии",
        user=user,
        active_section="studios",
        section_title="Студии",
        section_description="Здесь размещается полное описание студий с картинками и разбивкой по тематическим блокам.",
    )


@app.route("/history", methods=["GET"])
def history_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    return render_react_page(
        "placeholder",
        "История и кодекс",
        user=user,
        active_section="history",
        section_title="История и кодекс",
        section_description="Здесь собраны энциклопедия программы, лор и информация о главных персонажах.",
    )


@app.route("/bonus", methods=["GET"])
def bonus_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    return render_react_page(
        "placeholder",
        "Бонусная система",
        user=user,
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

    return render_react_page(
        "approve",
        "Подтверждение",
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
        flash("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435")
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
        flash("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u043b\u043e\u043d\u0438\u0442\u044c \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435")
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
