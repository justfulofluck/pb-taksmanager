import bcrypt

BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$", "$2x$")

def hash_password(password: str) -> str:
    if not isinstance(password, str) or password == "":
        return ""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, stored_password: str) -> bool:
    if not plain_password or not stored_password:
        return False
    if is_bcrypt_hash(stored_password):
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                stored_password.encode("utf-8")
            )
        except ValueError:
            return False
    # Legacy plaintext comparison (should only occur during migration)
    return plain_password == stored_password

def is_bcrypt_hash(value: str) -> bool:
    return isinstance(value, str) and value.startswith(BCRYPT_PREFIXES)
