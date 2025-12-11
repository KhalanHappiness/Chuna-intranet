from flask import Blueprint, jsonify
from datetime import datetime
from models import ShareLink
from extensions import db

share_bp = Blueprint('share', __name__)

@share_bp.route('/<token>', methods=['GET'])
def access_shared_repository(token):
    share_link = ShareLink.query.filter_by(token=token).first_or_404()

    # Check if link is active
    if not share_link.is_active:
        return jsonify({'error': 'This share link has been revoked'}), 403
    
    # Check if link has expired
    if share_link.expires_at and share_link.expires_at < datetime.utcnow():
        return jsonify({'error': 'Share link has expired'}), 403
    
     # Increment view count
    share_link.view_count += 1
    db.session.commit()
    
    repo = share_link.repository
    
    return jsonify({
        'id': repo.id,
        'name': repo.name,
        'description': repo.description,
        'permission': share_link.permission,
        'files': [{
            'id': f.id,
            'filename': f.original_filename,
            'file_type': f.file_type,
            'file_size': f.file_size,
            'created_at': f.created_at.isoformat()
        } for f in repo.files],
        'share_token': token
    })