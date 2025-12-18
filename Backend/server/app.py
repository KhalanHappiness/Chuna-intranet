from flask import Flask, send_from_directory
from flask_cors import CORS
import os
from server.extensions import db, jwt, migrate

def create_app():
    # Point to the Frontend build folder
    app = Flask(__name__, 
                static_folder='../../Frontend/dist',  # Vite uses 'dist' not 'build'
                static_url_path='')

    #Database configuration
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///mediarepo.db')

    # Fix for Render PostgreSQL URL (postgres:// -> postgresql://)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'}
    
    # CORS - you can remove this after serving from same origin
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
    
    # Serve React App for all non-API routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        # If it's an API route, let it pass through to the blueprints
        if path.startswith('api/'):
            return {'error': 'Not found'}, 404
            
        # Try to serve static files (CSS, JS, images)
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        
        # Otherwise serve index.html (for React Router)
        return send_from_directory(app.static_folder, 'index.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)