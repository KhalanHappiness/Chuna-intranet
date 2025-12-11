from app import create_app
from models import User
from extensions import db
from werkzeug.security import generate_password_hash

def setup_superadmin():
    app = create_app()
    
    with app.app_context():
        # Check if super admin exists
        if not User.query.filter_by(role='super_admin').first():
            super_admin = User(
                username='superadmin',
                email='admin@mediarepo.com',
                password_hash=generate_password_hash('Admin@123'),
                role='super_admin',
                is_approved=True
            )
            db.session.add(super_admin)
            db.session.commit()
            print("✅ Super admin created!")
            print("   Username: superadmin")
            print("   Password: Admin@123")
            print("   Email: admin@mediarepo.com")
        else:
            print("ℹ️  Super admin already exists")

if __name__ == '__main__':
    setup_superadmin()