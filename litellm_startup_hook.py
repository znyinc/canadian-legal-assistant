import os


DB_ENV_KEYS = (
    "DATABASE_URL",
    "DIRECT_URL",
    "DATABASE_HOST",
    "DATABASE_PORT",
    "DATABASE_USER",
    "DATABASE_USERNAME",
    "DATABASE_PASSWORD",
    "DATABASE_NAME",
    "DATABASE_SCHEMA",
    "IAM_TOKEN_DB_AUTH",
)


def clear_database_env() -> None:
    for key in DB_ENV_KEYS:
        os.environ.pop(key, None)
