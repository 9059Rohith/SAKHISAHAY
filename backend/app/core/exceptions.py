class AppError(Exception):
    """Expected application error with a safe public message."""

    def __init__(self, status: int, code: str, message: str):
        self.status = status
        self.code = code
        self.message = message
        super().__init__(message)
