from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
from server.models import Repository, File, DownloadLog, ShareLink
from server.extensions import db

files_bp = Blueprint('files', __name__)

def allowed_file(filename):
    allowed_extensions = current_app.config['ALLOWED_EXTENSIONS']
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@files_bp.route('/repositories/<int:repo_id>/upload', methods=['POST'])
@jwt_required()
def upload_file(repo_id):
    user_id = get_jwt_identity()
    repo = Repository.query.get_or_404(repo_id)
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    # Generate unique filename
    original_filename = secure_filename(file.filename)
    file_ext = original_filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    
    # Create repository folder if it doesn't exist
    repo_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], str(repo_id))
    os.makedirs(repo_folder, exist_ok=True)
    
    file_path = os.path.join(repo_folder, unique_filename)
    file.save(file_path)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Save to database
    file_obj = File(
        filename=unique_filename,
        original_filename=original_filename,
        file_path=file_path,
        file_type=file_ext,
        file_size=file_size,
        repository_id=repo_id,
        uploaded_by=user_id,
        tags=request.form.get('tags', '')
    )
    
    db.session.add(file_obj)
    db.session.commit()
    
    return jsonify(file_obj.to_dict(include_uploader=True)), 201

@files_bp.route('/files/<int:file_id>/download', methods=['GET'])
def download_file(file_id):
    try:
        file_obj = File.query.get_or_404(file_id)
        
        # Log the download
        share_token = request.args.get('share_token')
        share_link = None
        
        if share_token:
            share_link = ShareLink.query.filter_by(token=share_token).first()
        
        download_log = DownloadLog(
            file_id=file_id,
            share_link_id=share_link.id if share_link else None,
            repository_id=file_obj.repository_id,
            ip_address=request.remote_addr
        )
        db.session.add(download_log)
        db.session.commit()
        
        directory = os.path.dirname(file_obj.file_path)
        return send_from_directory(
            directory, 
            file_obj.filename, 
            as_attachment=True, 
            download_name=file_obj.original_filename
        )
    except Exception as e:
        print(f"Download error: {e}")
        return jsonify({'error': 'File not found'}), 404
