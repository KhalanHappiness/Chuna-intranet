from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Repository, ShareLink, DownloadLog, AppSettings
import os
import uuid

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# Helper function to check if user is super admin
def is_super_admin():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user and user.role == 'super_admin'

# Get all users (super admin only)
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    users = User.query.all()
    return jsonify([{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'is_approved': user.is_approved,
        'created_at': user.created_at.isoformat()
    } for user in users])

# Approve/reject user
@admin_bp.route('/users/<int:user_id>/approve', methods=['POST'])
@jwt_required()
def approve_user(user_id):
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    user.is_approved = data.get('approved', True)
    db.session.commit()
    
    return jsonify({'message': 'User status updated', 'is_approved': user.is_approved})


# Create new user (super admin only)
@admin_bp.route('/users/create', methods=['POST'])
@jwt_required()
def create_user():
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Username, email, and password are required'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Create user
    from werkzeug.security import generate_password_hash
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role=data.get('role', 'user'),  # Can set role
        is_approved=True  # Auto-approve admin-created users
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
    }), 201

# Get all repositories (super admin only)
@admin_bp.route('/repositories', methods=['GET'])
@jwt_required()
def get_all_repositories():
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    repos = Repository.query.all()
    return jsonify([{
        'id': repo.id,
        'name': repo.name,
        'description': repo.description,
        'owner': repo.owner.username,
        'owner_id': repo.owner_id,
        'files_count': len(repo.files),
        'created_at': repo.created_at.isoformat()
    } for repo in repos])

# Create repository (super admin)
@admin_bp.route('/repositories/create', methods=['POST'])
@jwt_required()
def create_repository_admin():
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    data = request.get_json()
    admin_id = get_jwt_identity()
    
    repo = Repository(
        name=data['name'],
        description=data.get('description', ''),
        repo_type=data.get('type', 'general'),
        owner_id=data.get('owner_id', admin_id)  # Can assign to any user
    )
    
    db.session.add(repo)
    db.session.commit()
    
    return jsonify({
        'id': repo.id,
        'name': repo.name,
        'description': repo.description,
        'owner_id': repo.owner_id
    }), 201

# Upload file to any repository (super admin)
@admin_bp.route('/repositories/<int:repo_id>/upload', methods=['POST'])
@jwt_required()
def upload_file_admin(repo_id):
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    from werkzeug.utils import secure_filename
    from flask import current_app
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    repo = Repository.query.get_or_404(repo_id)
    admin_id = get_jwt_identity()
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Generate unique filename
    original_filename = secure_filename(file.filename)
    file_ext = original_filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    
    # Create repository folder
    repo_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], str(repo_id))
    os.makedirs(repo_folder, exist_ok=True)
    
    file_path = os.path.join(repo_folder, unique_filename)
    file.save(file_path)
    
    # Save to database
    from models import File
    file_obj = File(
        filename=unique_filename,
        original_filename=original_filename,
        file_path=file_path,
        file_type=file_ext,
        file_size=os.path.getsize(file_path),
        repository_id=repo_id,
        uploaded_by=admin_id,
        tags=request.form.get('tags', '')
    )
    
    db.session.add(file_obj)
    db.session.commit()
    
    return jsonify({
        'id': file_obj.id,
        'filename': file_obj.original_filename,
        'file_type': file_obj.file_type
    }), 201

# Delete repository (super admin)
@admin_bp.route('/repositories/<int:repo_id>', methods=['DELETE'])
@jwt_required()
def delete_repository_admin(repo_id):
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    repo = Repository.query.get_or_404(repo_id)
    
    # Delete all files in the repository
    import shutil
    repo_folder = os.path.join('uploads', str(repo_id))
    if os.path.exists(repo_folder):
        shutil.rmtree(repo_folder)
    
    # Delete from database
    db.session.delete(repo)
    db.session.commit()
    
    return jsonify({'message': 'Repository deleted successfully'}), 200

# Get all share links
@admin_bp.route('/share-links', methods=['GET'])
@jwt_required()
def get_all_share_links():
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    links = ShareLink.query.all()
    return jsonify([{
        'id': link.id,
        'token': link.token,
        'repository_name': link.repository.name,
        'repository_id': link.repository_id,
        'permission': link.permission,
        'created_by': link.creator.username,
        'is_active': link.is_active,
        'view_count': link.view_count,
        'expires_at': link.expires_at.isoformat() if link.expires_at else None,
        'created_at': link.created_at.isoformat()
    } for link in links])

# Revoke share link
@admin_bp.route('/share-links/<int:link_id>/revoke', methods=['POST'])
@jwt_required()
def revoke_share_link(link_id):
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    link = ShareLink.query.get_or_404(link_id)
    link.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Share link revoked'})
# Reactivate share link
@admin_bp.route('/share-links/<int:link_id>/reactivate', methods=['POST'])
@jwt_required()
def reactivate_share_link(link_id):
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    link = ShareLink.query.get_or_404(link_id)
    link.is_active = True
    db.session.commit()
    
    return jsonify({'message': 'Share link reactivated', 'is_active': True})

# Get download statistics
@admin_bp.route('/downloads', methods=['GET'])
@jwt_required()
def get_download_stats():
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    # Get downloads grouped by repository
    downloads = db.session.query(
        Repository.id,
        Repository.name,
        db.func.count(DownloadLog.id).label('download_count')
    ).join(
        DownloadLog, Repository.id == DownloadLog.repository_id
    ).group_by(Repository.id).all()
    
    return jsonify([{
        'repository_id': repo_id,
        'repository_name': repo_name,
        'download_count': count
    } for repo_id, repo_name, count in downloads])

# Upload logo
@admin_bp.route('/settings/logo', methods=['POST'])
@jwt_required()
def upload_logo():
    if not is_super_admin():
        return jsonify({'error': 'Super admin access required'}), 403
    
    if 'logo' not in request.files:
        return jsonify({'error': 'No logo file provided'}), 400
    
    logo = request.files['logo']
    logo_type = request.form.get('type', 'main')  # 'main' or 'login'
    
    if logo.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Save logo
    filename = f"logo_{logo_type}_{uuid.uuid4()}.png"
    logo_path = os.path.join('static', 'logos', filename)
    os.makedirs(os.path.dirname(logo_path), exist_ok=True)
    logo.save(logo_path)
    
    # Save to settings
    setting = AppSettings.query.filter_by(key=f'logo_{logo_type}').first()
    if not setting:
        setting = AppSettings(key=f'logo_{logo_type}', value=filename)
        db.session.add(setting)
    else:
        setting.value = filename
    
    db.session.commit()
    
    return jsonify({
        'message': 'Logo uploaded successfully',
        'filename': filename,
        'url': f'/static/logos/{filename}'
    })