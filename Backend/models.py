from datetime import datetime
from extensions import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
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
    repository_id = db.Column(db.Integer, db.ForeignKey('repository.id'), nullable=False)  # Foreign Key
    permission = db.Column(db.String(20), nullable=False)  # view, edit, admin
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Foreign Key
    expires_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    repository = db.relationship('Repository')  # Relationship: ShareLink -> Repository
    creator = db.relationship('User')  # Relationship: ShareLink -> User
    
    def to_dict(self):
        return {
            'id': self.id,
            'token': self.token,
            'repository_id': self.repository_id,
            'permission': self.permission,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat()
        }
