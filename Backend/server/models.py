from datetime import datetime
from extensions import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'user' or 'super_admin'
    is_approved = db.Column(db.Boolean, default=False)  # NEW: approval status
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_approved': self.is_approved,
            'created_at': self.created_at.isoformat()
        }
    
class Repository(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Foreign Key
    repo_type = db.Column(db.String(50), default='general')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    owner = db.relationship('User', backref='repositories') 
    
    def to_dict(self, include_files=False, include_meetings=False):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'type': self.repo_type,
            'owner_id': self.owner_id,
            'created_at': self.created_at.isoformat()
        }
        
        if include_files:
            data['files'] = [f.to_dict() for f in self.files]
        else:
            data['file_count'] = len(self.files)
            
        if include_meetings:
            data['meetings'] = [m.to_dict() for m in self.meetings]
            
        return data
    
class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50))
    file_size = db.Column(db.Integer)
    repository_id = db.Column(db.Integer, db.ForeignKey('repository.id'), nullable=False)  # Foreign Key
    uploaded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Foreign Key
    tags = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    repository = db.relationship('Repository', backref='files')  # Relationship: File -> Repository
    uploader = db.relationship('User')  # Relationship: File -> User
    
    def to_dict(self, include_uploader=False):
        data = {
            'id': self.id,
            'filename': self.original_filename,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'tags': self.tags,
            'created_at': self.created_at.isoformat()
        }
        
        if include_uploader:
            data['uploaded_by'] = self.uploader.username
            
        return data

class ShareLink(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(100), unique=True, nullable=False)
    repository_id = db.Column(db.Integer, db.ForeignKey('repository.id'), nullable=False)
    permission = db.Column(db.String(20), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    expires_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)  # NEW: can be revoked
    view_count = db.Column(db.Integer, default=0)  # NEW: track views
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    repository = db.relationship('Repository')
    creator = db.relationship('User')
    
    def to_dict(self):
        return {
            'id': self.id,
            'token': self.token,
            'repository_id': self.repository_id,
            'permission': self.permission,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat()
        }
class Meeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey('repository.id'), nullable=False)  # Foreign Key
    title = db.Column(db.String(200), nullable=False)
    platform = db.Column(db.String(50))  # zoom, google_meet
    meeting_url = db.Column(db.String(500))
    scheduled_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Foreign Key
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    repository = db.relationship('Repository', backref='meetings')  # Relationship: Meeting -> Repository
    creator = db.relationship('User')  # Relationship: Meeting -> User
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'platform': self.platform,
            'meeting_url': self.meeting_url,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'created_at': self.created_at.isoformat()
        }
    
class DownloadLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    file_id = db.Column(db.Integer, db.ForeignKey('file.id'), nullable=False)
    share_link_id = db.Column(db.Integer, db.ForeignKey('share_link.id'), nullable=True)
    repository_id = db.Column(db.Integer, db.ForeignKey('repository.id'), nullable=False)
    downloaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(50))
    file = db.relationship('File')
    share_link = db.relationship('ShareLink')
    repository = db.relationship('Repository')

    def to_dict(self):
        return{
            'id': self.id,
            'downloaded_at': self.downloaded_at,
            'ip_address': self.ip_address,
            
        }

class AppSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


    def to_dict(self):

        return{
            'id': self.id,
            'key': self.key,
            'value': self.value,
            'updated_at':self.updated_at
        }
    
class LinkAccessLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    share_link_id = db.Column(db.Integer, db.ForeignKey('share_link.id'), nullable=False)
    email = db.Column(db.String(120))  # Optional email
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    accessed_at = db.Column(db.DateTime, default=datetime.utcnow)
    share_link = db.relationship('ShareLink')

    def to_dict(self):

        return{
            'id': self.id,
            'email': self.email,
            'ip_address':self.ip_address,
            'user_agent':self.user_agent,
            'accessed_at':self.accessed_at
        }