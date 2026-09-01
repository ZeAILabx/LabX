from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from app.config import Config


def get_supabase() -> Client:
    if not Config.SUPABASE_URL or 'your_supabase' in Config.SUPABASE_URL:
        raise ValueError("Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env")
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}}, supports_credentials=True)

    @app.before_request
    def handle_options_preflight():
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            response.status_code = 200
            return response

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.assessment import assessment_bp
    from app.routes.profile import profile_bp
    from app.routes.roadmap import roadmap_bp
    from app.routes.quests import quests_bp
    from app.routes.submissions import submissions_bp
    from app.routes.progress import progress_bp
    from app.routes.points import points_bp
    from app.routes.guilds import guilds_bp
    from app.routes.social import social_bp
    from app.routes.events import events_bp
    from app.routes.notifications import notifications_bp
    from app.routes.achievements import achievements_bp
    from app.routes.leaderboard import leaderboard_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(assessment_bp, url_prefix='/api/assessment')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(roadmap_bp, url_prefix='/api/roadmap')
    app.register_blueprint(quests_bp, url_prefix='/api/quests')
    app.register_blueprint(submissions_bp, url_prefix='/api/submissions')
    app.register_blueprint(progress_bp, url_prefix='/api/progress')
    app.register_blueprint(points_bp, url_prefix='/api/points')
    app.register_blueprint(guilds_bp, url_prefix='/api/guilds')
    app.register_blueprint(social_bp, url_prefix='/api/social')
    app.register_blueprint(events_bp, url_prefix='/api/events')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(achievements_bp, url_prefix='/api/achievements')
    app.register_blueprint(leaderboard_bp, url_prefix='/api/leaderboard')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    @app.route('/api/health')
    def health():
        return {'success': True, 'data': {'status': 'healthy'}}

    # Ensure all rules accept OPTIONS method for CORS preflights
    for rule in app.url_map.iter_rules():
        if rule.methods:
            rule.methods.add('OPTIONS')

    return app
