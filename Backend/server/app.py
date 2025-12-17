from flask import Flask
from flask_cors import CORS
import os
from extensions import db, jwt, migrate

def create_app():
    app = Flask(__name__)

    #Database configuration
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///mediarepo.db')

    # Fix for Render PostgreSQL URL (postgres:// -> postgresql://)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'}
    
    # Initialize CORS
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    CORS(app, resources={
        r"/api/*": {
            "origins": [frontend_url, "http://localhost:5173", "http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)  

    
    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.repositories import repositories_bp
    from routes.files import files_bp
    from routes.share import share_bp
    from routes.admin_routes import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(repositories_bp, url_prefix='/api/repositories')
    app.register_blueprint(files_bp, url_prefix='/api')
    app.register_blueprint(share_bp, url_prefix='/api/share')
    app.register_blueprint(admin_bp)     
    # # Create database tables
    # with app.app_context():
    #     db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)