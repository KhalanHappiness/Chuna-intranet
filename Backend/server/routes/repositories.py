from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import secrets
from models import Repository, ShareLink, Meeting
from extensions import db

repositories_bp = Blueprint('repositories', __name__)

@repositories_bp.route('', methods=['GET'])
@jwt_required()
def get_repositories():
    user_id = get_jwt_identity()
    repos = Repository.query.filter_by(owner_id=user_id).all()
    
    return jsonify([{
        'id': repo.id,
        'name': repo.name,
        'description': repo.description,
        'type': repo.repo_type,
        'files': len(repo.files),
        'created_at': repo.created_at.isoformat()
    } for repo in repos])

@repositories_bp.route('', methods=['POST'])
@jwt_required()
def create_repository():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    repo = Repository(
        name=data['name'],
        description=data.get('description', ''),
        repo_type=data.get('type', 'general'),
        owner_id=user_id
    )
    
    db.session.add(repo)
    db.session.commit()
    
    return jsonify({
        'id': repo.id,
        'name': repo.name,
        'description': repo.description,
        'type': repo.repo_type,
        'created_at': repo.created_at.isoformat()
    }), 201

@repositories_bp.route('/<int:repo_id>', methods=['GET'])
@jwt_required()
def get_repository(repo_id):
    user_id = get_jwt_identity()
    repo = Repository.query.get_or_404(repo_id)
    
    # Check if user has access
    if repo.owner_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'id': repo.id,
        'name': repo.name,
        'description': repo.description,
        'type': repo.repo_type,
        'files': [{
            'id': f.id,
            'filename': f.original_filename,
            'file_type': f.file_type,
            'file_size': f.file_size,
            'uploaded_by': f.uploader.username,
            'created_at': f.created_at.isoformat()
        } for f in repo.files],
        'meetings': [{
            'id': m.id,
            'title': m.title,
            'platform': m.platform,
            'meeting_url': m.meeting_url,
            'scheduled_at': m.scheduled_at.isoformat() if m.scheduled_at else None
        } for m in repo.meetings],
        'created_at': repo.created_at.isoformat()
    })

@repositories_bp.route('/<int:repo_id>/share', methods=['POST'])
@jwt_required()
def create_share_link(repo_id):
    user_id = get_jwt_identity()
    repo = Repository.query.get_or_404(repo_id)
    
    if repo.owner_id != user_id:
        return jsonify({'error': 'Only owner can create share links'}), 403
    
    data = request.get_json()
    permission = data.get('permission', 'view')
    expires_in_days = data.get('expires_in_days')
    
    # Generate unique token
    token = secrets.token_urlsafe(32)
    
    expires_at = None
    if expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
    
    share_link = ShareLink(
        token=token,
        repository_id=repo_id,
        permission=permission,
        created_by=user_id,
        expires_at=expires_at
    )
    
    db.session.add(share_link)
    db.session.commit()
    
    return jsonify({
        'token': token,
        'share_url': f"http://localhost:5173/share/{token}",
        'permission': permission,
        'expires_at': expires_at.isoformat() if expires_at else None
    }), 201

@repositories_bp.route('/<int:repo_id>/meetings', methods=['POST'])
@jwt_required()
def create_meeting(repo_id):
    user_id = get_jwt_identity()
    repo = Repository.query.get_or_404(repo_id)
    
    data = request.get_json()
    
    meeting = Meeting(
        repository_id=repo_id,
        title=data['title'],
        platform=data['platform'],
        meeting_url=data.get('meeting_url'),
        scheduled_at=datetime.fromisoformat(data['scheduled_at']) if data.get('scheduled_at') else None,
        created_by=user_id
    )
    
    db.session.add(meeting)
    db.session.commit()
    
    return jsonify({
        'id': meeting.id,
        'title': meeting.title,
        'platform': meeting.platform,
        'meeting_url': meeting.meeting_url,
        'scheduled_at': meeting.scheduled_at.isoformat() if meeting.scheduled_at else None
    }), 201