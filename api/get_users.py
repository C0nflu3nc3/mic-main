from api.functions import get_teams_for_select


def fetch_users_for_select(conn, is_admin, current_team_id):
    return get_teams_for_select(conn, is_admin, current_team_id)
