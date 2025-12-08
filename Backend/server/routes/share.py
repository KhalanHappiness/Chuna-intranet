from flask import Blueprint, jsonify
from datetime import datetime
from models import ShareLink

share_bp = Blueprint('share', __name__)

@share_bp.route('/<token>', methods=['GET'])
def access_shared_repository(token):
    share_link = ShareLink.query.filter_by(token=token).first_or_404()
    
    # Check if link has expired
    if share_link.expires_at and share_link.expires_at < datetime.utcnow():
        return jsonify({'error': 'Share link has expired'}), 403
    
    repo = share_link.repository
    
    # Get repository data with files
    repo_data = repo.to_dict(include_files=True)
    repo_data['permission'] = share_link.permission
    
    return jsonify(repo_data)