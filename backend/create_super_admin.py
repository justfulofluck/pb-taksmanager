import argparse
import sys
import models, schemas, crud
from database import SessionLocal
from security import hash_password, is_bcrypt_hash

def create_super_admin(email: str, name: str, password: str):
    db = SessionLocal()
    try:
        email_key = email.lower().strip()
        
        # 1. Update or create in user_auth table
        user = db.query(models.UserAuthDB).filter(models.UserAuthDB.email == email_key).first()
        if not user:
            user = models.UserAuthDB(email=email_key, name=name, password=hash_password(password))
            db.add(user)
            db.commit()
            print(f"✅ Created login account for: {email_key}")
        else:
            user.password = hash_password(password)
            user.name = name
            db.commit()
            print(f"🔄 Updated existing login account for: {email_key}")

        # 2. Update or create in team_members table
        member_id = email_key.replace("@", "-").replace(".", "-")
        existing_member = db.query(models.TeamMemberDB).filter(models.TeamMemberDB.email == email_key).first()
        
        if not existing_member:
            schema = schemas.TeamMemberSchema(
                id=member_id,
                name=name,
                email=email_key,
                password=password, # Note: TeamMember stores plaintext password in current schema
                role="Workspace Super Admin",
                team="Management",
                accessLevel="Super Admin",
                onboardingStatus="Completed",
                avatarChar=name[:1].upper(),
                color="bg-violet-600",
                isMe=False,
                skills=["Administration"]
            )
            crud.save_team_member(db, schema)
            print(f"✅ Added {name} to team members as Super Admin.")
        else:
            existing_member.access_level = "Super Admin"
            existing_member.role = "Workspace Super Admin"
            existing_member.password = password
            db.commit()
            print(f"🔄 Updated existing team member {name} to Super Admin.")
            
        print("\n🎉 Super Admin creation complete! You can now log in.")
        
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new Super Admin for Pinobite Workspace")
    parser.add_argument("--email", required=True, help="Email address of the super admin")
    parser.add_argument("--name", required=True, help="Full name of the super admin")
    parser.add_argument("--password", required=True, help="Password for the super admin")
    
    args = parser.parse_args()
    create_super_admin(args.email, args.name, args.password)
