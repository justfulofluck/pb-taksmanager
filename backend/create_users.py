"""
Idempotent user provisioning script for Pinobite Workspace.

Creates the workspace Super Admin and (optionally) additional users in both
the `user_auth` (login) and `team_members` tables, and migrates any legacy
plaintext passwords in `user_auth` to bcrypt hashes.

Usage:
    cd /www/wwwroot/tm.pinobite.com/backend
    venv/bin/python create_users.py

Run as often as needed; it is safe to re-run.
"""
import models, schemas, crud
from database import SessionLocal
from security import hash_password, is_bcrypt_hash

SUPER_ADMIN = {
    "email": "thakarkushagra@gmail.com",
    "name": "Kushagra Thakur",
    "password": "kushgt25",
    "role": "Workspace Super Admin",
    "team": "Engineering",
    "access_level": "Super Admin",
    "id": "super_admin_default",
}

# Additional users to provision: add dicts with the same keys as SUPER_ADMIN.
# access_level options: 'Super Admin' | 'Admin' | 'Member' | 'Viewer'
EXTRA_USERS = []


def upsert_auth_user(db, email: str, name: str, password: str):
    email_key = email.lower().strip()
    user = db.query(models.UserAuthDB).filter(models.UserAuthDB.email == email_key).first()
    if not user:
        user = models.UserAuthDB(email=email_key, name=name, password=hash_password(password))
        db.add(user)
        db.commit()
        print(f"  + created login account: {email_key}")
    elif not is_bcrypt_hash(user.password):
        user.password = hash_password(password)
        user.name = name
        db.commit()
        print(f"  ~ re-hashed legacy password for: {email_key}")
    else:
        print(f"  = already exists (login ok): {email_key}")


def upsert_team_member(db, data: dict):
    existing = db.query(models.TeamMemberDB).filter(models.TeamMemberDB.id == data["id"]).first()
    if existing:
        print(f"  = already exists (member): {data['email']}")
        return
    schema = schemas.TeamMemberSchema(
        id=data["id"],
        name=data["name"],
        email=data["email"],
        password=data["password"],
        role=data.get("role", "Team Member"),
        team=data.get("team", ""),
        accessLevel=data["access_level"],
        onboardingStatus=data.get("onboarding_status", "Completed"),
        avatarChar=data.get("avatar_char", data["name"][:1].upper()),
        color=data.get("color", "bg-violet-600"),
        isMe=data.get("is_me", False),
        skills=data.get("skills", []),
    )
    crud.save_team_member(db, schema)
    print(f"  + created team member: {data['email']}")


def migrate_plaintext_passwords(db):
    users = db.query(models.UserAuthDB).all()
    migrated = 0
    for user in users:
        if user.password and not is_bcrypt_hash(user.password):
            user.password = hash_password(user.password)
            migrated += 1
    if migrated:
        db.commit()
        print(f"  ~ migrated {migrated} legacy plaintext password(s) to hashes")
    else:
        print("  = no legacy plaintext passwords found")


def main():
    db = SessionLocal()
    try:
        print("Provisioning super admin & users...")
        upsert_auth_user(db, SUPER_ADMIN["email"], SUPER_ADMIN["name"], SUPER_ADMIN["password"])
        upsert_team_member(db, SUPER_ADMIN)

        for user_data in EXTRA_USERS:
            upsert_auth_user(db, user_data["email"], user_data["name"], user_data["password"])
            upsert_team_member(db, user_data)

        print("Migrating legacy passwords...")
        migrate_plaintext_passwords(db)

        print("\nDone. Final user_auth table:")
        for user in db.query(models.UserAuthDB).all():
            hashed = "HASHED" if is_bcrypt_hash(user.password) else "PLAINTEXT"
            print(f"  - {user.email}  ({user.name})  [{hashed}]")
    finally:
        db.close()


if __name__ == "__main__":
    main()
