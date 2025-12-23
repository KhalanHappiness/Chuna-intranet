from flask import Flask, jsonify
from flask_cors import CORS
import os
from server.extensions import db, jwt, migrate  # ✅ Remove 'server.'

def create_app():
    app = Flask(__name__)

    # Database configuration
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///mediarepo.db')

    # Fix for Render PostgreSQL URL
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', '05585a1f70015b1773f1c60670d8093cccc22599e47c73133a09795e4f61d1cf')
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'}
    
    # CORS - Allow your frontend URL
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                frontend_url,
                "http://localhost:5173",
                "http://localhost:3000",
                "https://chuna-intranet.vercel.app"  # Your frontend
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)

    

    migrate.init_app(app, db)
    
    # Create upload folder
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Health check routes
    @app.route('/')
    def home():
        return jsonify({
            'status': 'ok',
            'message': 'Chuna Intranet API is running',
            'version': '1.0',
            'endpoints': {
                'health': '/health',
                'api': '/api/*'
            }
        })
    
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy'})
    
    # Register API blueprints - ✅ Remove 'server.' prefix
    from server.routes.auth import auth_bp
    from server.routes.repositories import repositories_bp
    from server.routes.files import files_bp
    from server.routes.share import share_bp
    from server.routes.admin_routes import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(repositories_bp, url_prefix='/api/repositories')
    app.register_blueprint(files_bp, url_prefix='/api')
    app.register_blueprint(share_bp, url_prefix='/api/share')
    app.register_blueprint(admin_bp)
    
    # Log registered routes
    print("=" * 50)
    print("Registered Routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint}: {rule.rule} [{', '.join(rule.methods - {'HEAD', 'OPTIONS'})}]")
    print("=" * 50)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)