import json
import os
import secrets
import shutil
from datetime import date, datetime
from functools import lru_cache
from urllib.parse import urlparse

from flask import Flask, abort, flash, get_flashed_messages, redirect, render_template, request, send_from_directory, session, url_for
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.utils import secure_filename

from api.add_operation import create_transfer
from api.functions import (
    add_news,
    add_studio,
    add_news_comment,
    accept_mission,
    approve_mission,
    count_pending_news,
    delete_news,
    delete_news_comment,
    delete_studio,
    cancel_mission,
    create_mission,
    delete_mission,
    get_approve_queue,
    get_current_team_id_by_user_id,
    get_leaderboard_table,
    get_news_for_update,
    get_missions,
    get_news,
    get_studio,
    get_studios,
    get_operations,
    get_plt,
    publish_news,
    reject_news,
    get_scoreboard,
    get_teams_for_select,
    ensure_news_comment_columns,
    ensure_mission_columns,
    ensure_news_media_columns,
    ensure_studios_table,
    reject_mission,
    update_leaderboard_entry,
    update_mission,
    update_news,
    update_studio,
)
from helper.connect import get_connection
from helper.logout import logout_user
from helper.signin import sign_in_user

app = Flask(__name__, template_folder="pages", static_folder="static")
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
app.secret_key = (
    os.getenv("FLASK_SECRET_KEY")
    or os.getenv("SECRET_KEY")
    or secrets.token_hex(32)
)

default_upload_root = os.path.join(app.root_path, "uploads")
persistent_upload_root = (
    os.getenv("UPLOAD_ROOT")
    or os.getenv("RAILWAY_VOLUME_MOUNT_PATH")
    or default_upload_root
)
legacy_upload_folder = os.path.join(default_upload_root, "news")

app.config["UPLOAD_ROOT"] = persistent_upload_root
app.config["UPLOAD_FOLDER"] = os.path.join(persistent_upload_root, "news")
app.config["STUDIOS_UPLOAD_FOLDER"] = os.path.join(persistent_upload_root, "studios")
app.config["LEGACY_UPLOAD_FOLDER"] = legacy_upload_folder
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = int(os.getenv("SEND_FILE_MAX_AGE_DEFAULT", "86400"))
app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_CONTENT_LENGTH", str(32 * 1024 * 1024)))
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.getenv(
    "SESSION_COOKIE_SECURE",
    "0" if os.getenv("FLASK_DEBUG") == "1" else "1",
) == "1"

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
ALLOWED_VIDEO_EXTENSIONS = {"mp4", "webm", "ogg", "mov", "m4v"}
MAX_LOGIN_LENGTH = 128
MAX_PASSWORD_LENGTH = 1024
MAX_TITLE_LENGTH = 255
MAX_LEADERBOARD_NAME_LENGTH = 255
MAX_NEWS_CONTENT_LENGTH = 12000
MAX_COMMENT_LENGTH = 2000
MAX_MISSION_DESCRIPTION_LENGTH = 8000
MAX_STUDIO_DESCRIPTION_LENGTH = 8000
MAX_TRANSFER_COMMENT_LENGTH = 500
os.makedirs(app.config["UPLOAD_ROOT"], exist_ok=True)
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(app.config["STUDIOS_UPLOAD_FOLDER"], exist_ok=True)


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


@lru_cache(maxsize=1)
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


def resolve_upload_storage_path(public_path):
    if not public_path or not public_path.startswith("uploads/"):
        return None

    relative_path = public_path[len("uploads/"):].replace("/", os.sep)
    upload_root = os.path.abspath(app.config["UPLOAD_ROOT"])
    absolute_path = os.path.abspath(os.path.join(upload_root, relative_path))
    if absolute_path != upload_root and not absolute_path.startswith(upload_root + os.sep):
        return None
    return absolute_path


def delete_uploaded_paths(paths):
    for public_path in {path for path in paths if path}:
        absolute_path = resolve_upload_storage_path(public_path)
        if absolute_path and os.path.isfile(absolute_path):
            try:
                os.remove(absolute_path)
            except OSError:
                continue


def render_react_page(page, page_title, user=None, active_section=None, **page_data):
    bootstrap = {
        "page": page,
        "pageTitle": page_title,
        "activeSection": active_section,
        "user": serialize_for_react(user) if user else None,
        "messages": get_flashed_messages(),
    }
    if user and can_review_suggested_news(user) and "pending_news_count" not in page_data:
        conn = get_connection()
        try:
            ensure_news_media_columns(conn)
            page_data["pending_news_count"] = count_pending_news(conn)
        finally:
            conn.close()
    bootstrap.update(serialize_for_react(page_data))
    return render_template(
        "react-shell.j2",
        bootstrap=bootstrap,
        page_title=page_title,
        frontend_assets=get_frontend_assets(),
    )


def require_user():
    user = session.get("user")
    if not user:
        return None, redirect(url_for("index"))
    return user, None


def is_same_origin_source(value):
    if not value:
        return False

    parsed_value = urlparse(value)
    parsed_host = urlparse(request.host_url)
    return (
        parsed_value.scheme == parsed_host.scheme
        and parsed_value.netloc == parsed_host.netloc
    )


@app.before_request
def protect_state_changing_requests():
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return None

    origin = request.headers.get("Origin")
    referer = request.headers.get("Referer")
    if is_same_origin_source(origin) or is_same_origin_source(referer):
        return None

    abort(403)


@app.after_request
def set_security_headers(response):
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    response.headers.setdefault(
        "Content-Security-Policy",
        "; ".join(
            [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com data:",
                "img-src 'self' data: blob:",
                "media-src 'self' blob:",
                "connect-src 'self'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
            ]
        ),
    )
    return response


@app.errorhandler(413)
def request_entity_too_large(_error):
    flash("Файл слишком большой")
    redirect_target = request.referrer if is_same_origin_source(request.referrer) else url_for("home_page")
    return redirect(redirect_target)


def can_manage_news(user):
    return bool(user["isadmin"]) or bool(user.get("isjournalist"))


def can_review_suggested_news(user):
    return bool(user["isadmin"])


def can_suggest_news(user):
    return not bool(user["isadmin"]) and not bool(user.get("isjournalist"))


def can_manage_studios(user):
    return bool(user["isadmin"])


def can_manage_leaderboards(user):
    return bool(user["isadmin"])


def can_take_missions(user):
    return not bool(user["isadmin"]) and not bool(user.get("isjournalist"))


def is_text_too_long(value, max_length):
    return len(value) > max_length


def is_allowed_extension(filename, allowed_extensions):
    if not filename or "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].lower()
    return extension in allowed_extensions


def read_uploaded_file_header(uploaded_file, size=64):
    stream = getattr(uploaded_file, "stream", None)
    if stream is None:
        return b""

    try:
        current_position = stream.tell()
    except (AttributeError, OSError):
        current_position = None

    try:
        stream.seek(0)
        return stream.read(size)
    except (AttributeError, OSError):
        return b""
    finally:
        if current_position is not None:
            try:
                stream.seek(current_position)
            except (AttributeError, OSError):
                pass


def has_allowed_file_signature(uploaded_file, allowed_extensions):
    filename = getattr(uploaded_file, "filename", "") or ""
    if "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()
    if extension not in allowed_extensions:
        return False

    header = read_uploaded_file_header(uploaded_file, size=64)
    if not header:
        return False

    if extension == "png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    if extension in {"jpg", "jpeg"}:
        return header.startswith(b"\xff\xd8\xff")
    if extension == "gif":
        return header.startswith((b"GIF87a", b"GIF89a"))
    if extension == "webp":
        return len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WEBP"
    if extension == "webm":
        return header.startswith(b"\x1A\x45\xDF\xA3")
    if extension == "ogg":
        return header.startswith(b"OggS")
    if extension in {"mp4", "mov", "m4v"}:
        return len(header) >= 12 and header[4:8] == b"ftyp"

    return False


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


def save_uploaded_media(uploaded_file, allowed_extensions, fallback_base_name, target_folder, public_prefix):
    if uploaded_file is None or uploaded_file.filename == "":
        return None
    if not is_allowed_extension(uploaded_file.filename, allowed_extensions):
        return None
    if not has_allowed_file_signature(uploaded_file, allowed_extensions):
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
    file_path = os.path.join(target_folder, filename)
    suffix = 2
    while os.path.exists(file_path):
        filename = f"{safe_base_name}-{suffix}{extension}"
        file_path = os.path.join(target_folder, filename)
        suffix += 1

    os.makedirs(target_folder, exist_ok=True)
    file_path = os.path.join(target_folder, filename)
    uploaded_file.save(file_path)
    return f"{public_prefix}/{filename}"


def save_news_media(uploaded_file, allowed_extensions, fallback_base_name):
    return save_uploaded_media(
        uploaded_file,
        allowed_extensions,
        fallback_base_name,
        app.config["UPLOAD_FOLDER"],
        "uploads/news",
    )


def save_news_image(uploaded_file):
    return save_news_media(uploaded_file, ALLOWED_IMAGE_EXTENSIONS, "news-image")


def save_news_video(uploaded_file):
    return save_news_media(uploaded_file, ALLOWED_VIDEO_EXTENSIONS, "news-video")


def save_studio_image(uploaded_file):
    return save_uploaded_media(
        uploaded_file,
        ALLOWED_IMAGE_EXTENSIONS,
        "studio-image",
        app.config["STUDIOS_UPLOAD_FOLDER"],
        "uploads/studios",
    )


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
            delete_uploaded_paths([item["media_path"] for item in saved_media])
            return None, "Не удалось проверить или сохранить один из медиафайлов"

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
    return send_from_directory("static", "mic.jpg", mimetype="image/jpeg")


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

    if is_text_too_long(login, MAX_LOGIN_LENGTH) or is_text_too_long(password, MAX_PASSWORD_LENGTH):
        flash("Слишком длинный логин или пароль")
        return redirect(url_for("index"))

    ok, message = sign_in_user(login, password, session)
    if ok:
        return redirect(url_for("home_page"))

    flash(message)
    return redirect(url_for("index"))


@app.route("/logout", methods=["POST"])
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
        can_manage_leaderboards=can_manage_leaderboards(user),
        active_section="home",
        overall_leaderboard=overall_leaderboard,
        duel_leaderboard=duel_leaderboard,
    )


@app.route("/leaderboard/update", methods=["POST"])
def update_leaderboard_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_manage_leaderboards(user):
        return redirect(url_for("leaderboard_page"))

    table_name = request.form.get("table_name", "").strip()
    user_id = request.form.get("user_id", "").strip()
    name = request.form.get("name", "").strip()
    score_raw = request.form.get("score", "").strip()

    if (
        not user_id.isdigit()
        or not name
        or not score_raw
        or is_text_too_long(name, MAX_LEADERBOARD_NAME_LENGTH)
    ):
        flash("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0441\u0442\u0440\u043e\u043a\u0443 \u0442\u0430\u0431\u043b\u0438\u0446\u044b")
        return redirect(url_for("leaderboard_page"))

    try:
        score = int(score_raw)
    except ValueError:
        flash("\u041e\u0447\u043a\u0438 \u0434\u043e\u043b\u0436\u043d\u044b \u0431\u044b\u0442\u044c \u0446\u0435\u043b\u044b\u043c \u0447\u0438\u0441\u043b\u043e\u043c")
        return redirect(url_for("leaderboard_page"))

    conn = get_connection()
    try:
        updated = update_leaderboard_entry(conn, table_name, int(user_id), name, score)
    except ValueError:
        flash("\u041d\u0435\u0432\u0435\u0440\u043d\u0430\u044f \u0442\u0430\u0431\u043b\u0438\u0446\u0430")
        return redirect(url_for("leaderboard_page"))
    finally:
        conn.close()

    flash(
        "\u0421\u0442\u0440\u043e\u043a\u0430 \u0442\u0430\u0431\u043b\u0438\u0446\u044b \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0430"
        if updated
        else "\u0421\u0442\u0440\u043e\u043a\u0430 \u0442\u0430\u0431\u043b\u0438\u0446\u044b \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430"
    )
    return redirect(url_for("leaderboard_page"))


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
        pending_news_count = count_pending_news(conn) if can_review_suggested_news(user) else 0
    finally:
        conn.close()

    return render_react_page(
        "news",
        "\u041d\u043e\u0432\u043e\u0441\u0442\u0438",
        user=user,
        can_manage_news=can_manage_news(user),
        can_suggest_news=can_suggest_news(user),
        pending_news_count=pending_news_count,
        active_section="home",
        news_items=news_items,
    )


@app.route("/news/suggestions", methods=["GET"])
def suggested_news_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_review_suggested_news(user):
        return redirect(url_for("news_page"))

    conn = get_connection()
    try:
        ensure_news_comment_columns(conn)
        ensure_news_media_columns(conn)
        suggested_news_items = get_news(conn, publication_status=0)
        pending_news_count = count_pending_news(conn)
    finally:
        conn.close()

    return render_react_page(
        "news_suggestions",
        "\u041f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u043d\u044b\u0435 \u043d\u043e\u0432\u043e\u0441\u0442\u0438",
        user=user,
        can_manage_news=can_manage_news(user),
        pending_news_count=pending_news_count,
        active_section="news_suggestions",
        suggested_news_items=suggested_news_items,
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

    if (
        not title
        or not content
        or is_text_too_long(title, MAX_TITLE_LENGTH)
        or is_text_too_long(content, MAX_NEWS_CONTENT_LENGTH)
    ):
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

    saved_media_paths = [item["media_path"] for item in media_items]
    image_path = next((item["media_path"] for item in media_items if item["media_type"] == "image"), None)
    video_path = next((item["media_path"] for item in media_items if item["media_type"] == "video"), None)

    conn = get_connection()
    created = False
    try:
        ensure_news_media_columns(conn)
        add_news(conn, int(user["id"]), title, content, image_path, video_path, media_items, is_published=1)
        created = True
    finally:
        conn.close()
        if not created:
            delete_uploaded_paths(saved_media_paths)

    flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0430")
    return redirect(url_for("news_page"))


@app.route("/news/suggest", methods=["POST"])
def suggest_news_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_suggest_news(user):
        return redirect(url_for("news_page"))

    title = request.form.get("title", "").strip()
    content = request.form.get("content", "").strip()
    media_files = request.files.getlist("media")

    if (
        not title
        or not content
        or is_text_too_long(title, MAX_TITLE_LENGTH)
        or is_text_too_long(content, MAX_NEWS_CONTENT_LENGTH)
    ):
        flash("\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0437\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a \u0438 \u0442\u0435\u043a\u0441\u0442 \u043d\u043e\u0432\u043e\u0441\u0442\u0438")
        return redirect(url_for("news_page"))

    media_items, media_error = collect_news_media_files(media_files)
    if media_error:
        flash(media_error)
        return redirect(url_for("news_page"))

    saved_media_paths = [item["media_path"] for item in media_items]
    image_path = next((item["media_path"] for item in media_items if item["media_type"] == "image"), None)
    video_path = next((item["media_path"] for item in media_items if item["media_type"] == "video"), None)

    conn = get_connection()
    created = False
    try:
        ensure_news_media_columns(conn)
        add_news(conn, int(user["id"]), title, content, image_path, video_path, media_items, is_published=0)
        created = True
    finally:
        conn.close()
        if not created:
            delete_uploaded_paths(saved_media_paths)

    flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0430 \u043d\u0430 \u0440\u0430\u0441\u0441\u043c\u043e\u0442\u0440\u0435\u043d\u0438\u0435")
    return redirect(url_for("news_page"))


def get_news_redirect_url(news_item=None):
    redirect_to = request.form.get("redirect_to", "").strip()
    if redirect_to == "/news/suggestions":
        return redirect_to
    if news_item is not None and int(news_item.get("is_published") or 0) == 0:
        return url_for("suggested_news_page")
    return url_for("news_page")


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

    if (
        not news_id.isdigit()
        or not title
        or not content
        or is_text_too_long(title, MAX_TITLE_LENGTH)
        or is_text_too_long(content, MAX_NEWS_CONTENT_LENGTH)
    ):
        flash("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043d\u043e\u0432\u043e\u0441\u0442\u044c")
        return redirect(get_news_redirect_url())

    removed_media_ids = {
        int(media_id)
        for media_id in remove_media_ids_raw
        if media_id.isdigit()
    }

    new_media_items, media_error = collect_news_media_files(media_files)
    if media_error:
        flash(media_error)
        return redirect(get_news_redirect_url())

    new_media_paths = [item["media_path"] for item in new_media_items]
    conn = get_connection()
    redirect_url = url_for("news_page")
    removed_paths = []
    update_succeeded = False
    try:
        ensure_news_media_columns(conn)
        news_item = get_news_for_update(conn, int(news_id))
        if news_item is None:
            delete_uploaded_paths(new_media_paths)
            flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430")
            return redirect(redirect_url)
        if int(news_item.get("is_published") or 0) == 0 and not can_review_suggested_news(user):
            delete_uploaded_paths(new_media_paths)
            return redirect(redirect_url)

        redirect_url = get_news_redirect_url(news_item)
        final_media, final_media_error = build_updated_news_media(
            news_item["media"],
            removed_media_ids,
            new_media_items,
        )
        if final_media_error:
            delete_uploaded_paths(new_media_paths)
            flash(final_media_error)
            return redirect(redirect_url)

        final_media_paths = {item["media_path"] for item in final_media}
        removed_paths = [
            item["media_path"]
            for item in news_item["media"]
            if item.get("media_path") and item["media_path"] not in final_media_paths
        ]
        update_news(conn, int(news_id), title, content, final_media)
        update_succeeded = True
    finally:
        conn.close()
        if update_succeeded:
            delete_uploaded_paths(removed_paths)
        else:
            delete_uploaded_paths(new_media_paths)

    flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0430")
    return redirect(redirect_url)


@app.route("/news/publish", methods=["POST"])
def publish_news_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_review_suggested_news(user):
        return redirect(url_for("news_page"))

    news_id = request.form.get("news_id", "").strip()
    if not news_id.isdigit():
        flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043d\u0435 \u043e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u0430")
        return redirect(url_for("suggested_news_page"))

    conn = get_connection()
    try:
        ensure_news_media_columns(conn)
        ok = publish_news(conn, int(news_id))
    finally:
        conn.close()

    flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u0430" if ok else "\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043d\u0435 \u043e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u0430")
    return redirect(url_for("suggested_news_page"))


@app.route("/news/reject", methods=["POST"])
def reject_news_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_review_suggested_news(user):
        return redirect(url_for("news_page"))

    news_id = request.form.get("news_id", "").strip()
    if not news_id.isdigit():
        flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043d\u0435 \u043e\u0442\u043a\u043b\u043e\u043d\u0435\u043d\u0430")
        return redirect(url_for("suggested_news_page"))

    conn = get_connection()
    deleted_paths = []
    try:
        ensure_news_media_columns(conn)
        news_item = get_news_for_update(conn, int(news_id))
        if news_item is not None:
            deleted_paths = [item["media_path"] for item in news_item.get("media", []) if item.get("media_path")]
        ok = reject_news(conn, int(news_id))
    finally:
        conn.close()

    if ok:
        delete_uploaded_paths(deleted_paths)
    flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043e\u0442\u043a\u043b\u043e\u043d\u0435\u043d\u0430" if ok else "\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043d\u0435 \u043e\u0442\u043a\u043b\u043e\u043d\u0435\u043d\u0430")
    return redirect(url_for("suggested_news_page"))


@app.route("/news/delete", methods=["POST"])
def delete_news_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_manage_news(user):
        return redirect(url_for("news_page"))

    news_id = request.form.get("news_id", "").strip()
    if not news_id.isdigit():
        flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043d\u0435 \u0443\u0434\u0430\u043b\u0435\u043d\u0430")
        return redirect(get_news_redirect_url())

    conn = get_connection()
    redirect_url = url_for("news_page")
    deleted_paths = []
    try:
        ensure_news_comment_columns(conn)
        ensure_news_media_columns(conn)
        news_item = get_news_for_update(conn, int(news_id))
        if news_item is not None:
            redirect_url = get_news_redirect_url(news_item)
            deleted_paths = [item["media_path"] for item in news_item.get("media", []) if item.get("media_path")]
        ok = delete_news(conn, int(news_id))
    finally:
        conn.close()

    if ok:
        delete_uploaded_paths(deleted_paths)
    flash("\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u0443\u0434\u0430\u043b\u0435\u043d\u0430" if ok else "\u041d\u043e\u0432\u043e\u0441\u0442\u044c \u043d\u0435 \u0443\u0434\u0430\u043b\u0435\u043d\u0430")
    return redirect(redirect_url)


@app.route("/news/comment", methods=["POST"])
def add_news_comment_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    news_id = request.form.get("news_id", "").strip()
    comment = request.form.get("comment", "").strip()
    parent_comment_id = request.form.get("parent_comment_id", "").strip()

    if not news_id.isdigit() or not comment or is_text_too_long(comment, MAX_COMMENT_LENGTH):
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
        ensure_mission_columns(conn)
        if current_team_id is None:
            current_team_id = get_current_team_id_by_user_id(conn, int(user["id"]))
            user["team_id"] = current_team_id
            session["user"] = user
        mission_view_team_id = None if is_admin else current_team_id
        missions, current_team_mission_count = get_missions(conn, mission_view_team_id)
    finally:
        conn.close()

    return render_react_page(
        "missions",
        "\u041c\u0438\u0441\u0441\u0438\u0438 \u0437\u0430 \u0432\u0430\u043b\u044e\u0442\u0443",
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
    is_exclusive = request.form.get("is_exclusive") == "1"
    max_accepted_count_raw = request.form.get("max_accepted_count", "").strip()
    max_accepted_count = int(max_accepted_count_raw) if max_accepted_count_raw.isdigit() else 3

    if (
        not title
        or not description
        or not reward.isdigit()
        or int(reward) <= 0
        or is_text_too_long(title, MAX_TITLE_LENGTH)
        or is_text_too_long(description, MAX_MISSION_DESCRIPTION_LENGTH)
    ):
        flash("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u0437\u0430\u0434\u0430\u043d\u0438\u044f \u0438 \u043d\u0430\u0433\u0440\u0430\u0434\u044b")
        return redirect(url_for("missions_page"))
    if max_accepted_count <= 0:
        flash("Укажите корректный лимит откликов")
        return redirect(url_for("missions_page"))

    conn = get_connection()
    try:
        ensure_mission_columns(conn)
        create_mission(
            conn,
            title,
            description,
            int(reward),
            int(user["id"]),
            is_exclusive=is_exclusive,
            max_accepted_count=max_accepted_count,
        )
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
        ensure_mission_columns(conn)
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


@app.route("/missions/update", methods=["POST"])
def update_mission_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not bool(user["isadmin"]):
        return redirect(url_for("missions_page"))

    mission_id = request.form.get("mission_id", "").strip()
    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    reward = request.form.get("reward", "").strip()
    is_exclusive = request.form.get("is_exclusive") == "1"
    max_accepted_count_raw = request.form.get("max_accepted_count", "").strip()
    max_accepted_count = int(max_accepted_count_raw) if max_accepted_count_raw.isdigit() else 3

    if not mission_id.isdigit():
        flash("Не удалось обновить задание")
        return redirect(url_for("missions_page"))

    if (
        not title
        or not description
        or not reward.isdigit()
        or int(reward) <= 0
        or is_text_too_long(title, MAX_TITLE_LENGTH)
        or is_text_too_long(description, MAX_TEXT_LENGTH)
    ):
        flash("Заполните поля задания корректно")
        return redirect(url_for("missions_page"))
    if max_accepted_count <= 0:
        flash("Укажите корректный лимит откликов")
        return redirect(url_for("missions_page"))

    conn = get_connection()
    try:
        ensure_mission_columns(conn)
        ok, message = update_mission(
            conn,
            int(mission_id),
            title,
            description,
            int(reward),
            is_exclusive=is_exclusive,
            max_accepted_count=max_accepted_count,
        )
    except Exception:
        app.logger.exception("Failed to update mission")
        flash("Не удалось обновить задание")
        return redirect(url_for("missions_page"))
    finally:
        conn.close()

    flash(message if ok else "Не удалось обновить задание")
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
        "\u0411\u0430\u043d\u043a",
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

    conn = get_connection()
    try:
        ensure_studios_table(conn)
        studios_items = get_studios(conn, int(user["id"]), can_manage_studios(user))
    finally:
        conn.close()

    return render_react_page(
        "studios",
        "\u041a\u0430\u0444\u0435\u0434\u0440\u044b",
        user=user,
        active_section="studios",
        can_manage_studios=can_manage_studios(user),
        studios_items=studios_items,
    )


@app.route("/studios/add", methods=["POST"])
def add_studio_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_manage_studios(user):
        return redirect(url_for("studios_page"))

    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    audience = request.form.get("audience", "all").strip()
    image_file = request.files.get("image")
    allowed_audiences = {"all", "middle", "senior"}

    if (
        not title
        or not description
        or is_text_too_long(title, MAX_TITLE_LENGTH)
        or is_text_too_long(description, MAX_STUDIO_DESCRIPTION_LENGTH)
    ):
        flash("\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u043a\u0430\u0444\u0435\u0434\u0440\u044b")
        return redirect(url_for("studios_page"))
    if audience not in allowed_audiences:
        flash("\u041d\u0435\u0432\u0435\u0440\u043d\u043e \u0432\u044b\u0431\u0440\u0430\u043d\u0430 \u0430\u0443\u0434\u0438\u0442\u043e\u0440\u0438\u044f \u043a\u0430\u0444\u0435\u0434\u0440\u044b")
        return redirect(url_for("studios_page"))

    image_path = save_studio_image(image_file)
    if image_file and image_file.filename and image_path is None:
        flash("Изображение кафедры не прошло проверку")
        return redirect(url_for("studios_page"))

    conn = get_connection()
    try:
        ensure_studios_table(conn)
        add_studio(conn, int(user["id"]), title, description, image_path, audience)
    finally:
        conn.close()

    flash("\u041a\u0430\u0444\u0435\u0434\u0440\u0430 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0430")
    return redirect(url_for("studios_page"))


@app.route("/studios/update", methods=["POST"])
def update_studio_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_manage_studios(user):
        return redirect(url_for("studios_page"))

    studio_id = request.form.get("studio_id", "").strip()
    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    audience = request.form.get("audience", "all").strip()
    remove_image = request.form.get("remove_image") == "1"
    image_file = request.files.get("image")
    allowed_audiences = {"all", "middle", "senior"}

    if (
        not studio_id.isdigit()
        or not title
        or not description
        or is_text_too_long(title, MAX_TITLE_LENGTH)
        or is_text_too_long(description, MAX_STUDIO_DESCRIPTION_LENGTH)
    ):
        flash("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043a\u0430\u0444\u0435\u0434\u0440\u0443")
        return redirect(url_for("studios_page"))
    if audience not in allowed_audiences:
        flash("\u041d\u0435\u0432\u0435\u0440\u043d\u043e \u0432\u044b\u0431\u0440\u0430\u043d\u0430 \u0430\u0443\u0434\u0438\u0442\u043e\u0440\u0438\u044f \u043a\u0430\u0444\u0435\u0434\u0440\u044b")
        return redirect(url_for("studios_page"))

    new_image_path = save_studio_image(image_file)
    if image_file and image_file.filename and new_image_path is None:
        flash("Изображение кафедры не прошло проверку")
        return redirect(url_for("studios_page"))
    conn = get_connection()
    studio_item = None
    old_image_path = None
    final_image_path = None
    updated = False
    try:
        ensure_studios_table(conn)
        studio_item = get_studio(conn, int(studio_id))
        if studio_item is not None:
            old_image_path = studio_item.get("image_path")
            final_image_path = None if remove_image else old_image_path
            if new_image_path:
                final_image_path = new_image_path

            updated = update_studio(conn, int(studio_id), title, description, final_image_path, audience)
    finally:
        conn.close()

    if studio_item is None:
        if new_image_path:
            delete_uploaded_paths([new_image_path])
        flash("\u041a\u0430\u0444\u0435\u0434\u0440\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430")
    elif updated:
        if old_image_path and old_image_path != final_image_path:
            delete_uploaded_paths([old_image_path])
        flash("\u041a\u0430\u0444\u0435\u0434\u0440\u0430 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0430")
    else:
        if new_image_path:
            delete_uploaded_paths([new_image_path])
        flash("\u041a\u0430\u0444\u0435\u0434\u0440\u0443 \u043d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c")
    return redirect(url_for("studios_page"))


@app.route("/studios/delete", methods=["POST"])
def delete_studio_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response
    if not can_manage_studios(user):
        return redirect(url_for("studios_page"))

    studio_id = request.form.get("studio_id", "").strip()
    if not studio_id.isdigit():
        flash("\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0438\u0434\u0435\u043d\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0440 \u043a\u0430\u0444\u0435\u0434\u0440\u044b")
        return redirect(url_for("studios_page"))

    conn = get_connection()
    try:
        ensure_studios_table(conn)
        studio_item = get_studio(conn, int(studio_id))
        deleted = delete_studio(conn, int(studio_id))
    finally:
        conn.close()

    if deleted and studio_item and studio_item.get("image_path"):
        delete_uploaded_paths([studio_item["image_path"]])

    flash("\u041a\u0430\u0444\u0435\u0434\u0440\u0430 \u0443\u0434\u0430\u043b\u0435\u043d\u0430")
    return redirect(url_for("studios_page"))


@app.route("/history", methods=["GET"])
def history_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    return render_react_page(
        "history",
        "\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0438 \u043a\u043e\u0434\u0435\u043a\u0441",
        user=user,
        active_section="history",
    )


@app.route("/bonus", methods=["GET"])
def bonus_page():
    user, redirect_response = require_user()
    if redirect_response:
        return redirect_response

    return render_react_page(
        "bonus",
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
        ensure_mission_columns(conn)
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

    if is_text_too_long(comment, MAX_TRANSFER_COMMENT_LENGTH):
        flash("Комментарий перевода слишком длинный")
        return redirect(url_for("teams_page"))

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
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        debug=os.getenv("FLASK_DEBUG") == "1",
    )
