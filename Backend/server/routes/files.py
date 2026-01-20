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

@files_bp.route('/<int:file_id>/download', methods=['GET'])
def download_file(file_id):
    print(f"\n{'='*60}")
    print(f"DOWNLOAD REQUEST RECEIVED")
    print(f"File ID: {file_id}")
    print(f"Request path: {request.path}")
    print(f"Request args: {request.args}")
    print(f"{'='*60}\n")
    
    try:
        file_obj = File.query.get(file_id)
        
        if not file_obj:
            print(f"❌ ERROR: File with ID {file_id} not found in database")
            return jsonify({'error': f'File with ID {file_id} not found'}), 404
        
        print(f"✅ Found file in database:")
        print(f"   - Original filename: {file_obj.original_filename}")
        print(f"   - Stored filename: {file_obj.filename}")
        print(f"   - File path: {file_obj.file_path}")
        print(f"   - Repository ID: {file_obj.repository_id}")
        
        # Check if file exists on disk
        if not os.path.exists(file_obj.file_path):
            print(f"❌ ERROR: File not found on disk at: {file_obj.file_path}")
            return jsonify({'error': 'File not found on server'}), 404
        
        print(f"✅ File exists on disk")
        
        # Log the download
        share_token = request.args.get('share_token')
        share_link = None
        
        if share_token:
            share_link = ShareLink.query.filter_by(token=share_token).first()
            print(f"   - Share token found: {share_token}")
        
        download_log = DownloadLog(
            file_id=file_id,
            share_link_id=share_link.id if share_link else None,
            repository_id=file_obj.repository_id,
            ip_address=request.remote_addr
        )
        db.session.add(download_log)
        db.session.commit()
        
        print(f"✅ Download log created")
        print(f"   - Sending file from: {os.path.dirname(file_obj.file_path)}")
        print(f"   - Filename: {file_obj.filename}")
        
        directory = os.path.join(current_app.root_path, os.path.dirname(file_obj.file_path))

        return send_from_directory(
            directory,
            file_obj.filename,
            as_attachment=True,
            download_name=file_obj.original_filename
)
    except Exception as e:
        print(f"\n❌ EXCEPTION in download_file:")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {str(e)}")
        import traceback
        print(f"   Traceback:\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500