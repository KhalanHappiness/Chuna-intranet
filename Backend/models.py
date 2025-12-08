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