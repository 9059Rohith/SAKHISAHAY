import asyncio
from email.message import EmailMessage
from html import escape

import aiosmtplib

from ..core.exceptions import AppError


class Mailer:
    def __init__(self, settings):
        self.settings = settings

    @property
    def available(self):
        return bool(self.settings.smtp_host and self.settings.email_from)

    async def send_link(self, recipient, purpose, link):
        if not self.available:
            raise AppError(
                503,
                "EMAIL_UNAVAILABLE",
                "Email delivery is not configured. Use your saved recovery code to reset your password.",
            )
        msg = EmailMessage()
        msg["From"] = self.settings.email_from
        msg["To"] = recipient
        msg["Subject"] = f"SAKHISAHAY: {purpose}"
        msg.set_content(
            f"{purpose}: {link}\nThis link expires in 30 minutes. If you did not request it, ignore this message."
        )
        msg.add_alternative(
            f'<p>{escape(purpose)}</p><p><a href="{escape(link, quote=True)}">Continue securely</a></p><p>This link expires in 30 minutes. Ignore it if you did not request it.</p>',
            subtype="html",
        )
        for attempt in range(3):
            try:
                await aiosmtplib.send(
                    msg,
                    hostname=self.settings.smtp_host,
                    port=self.settings.smtp_port,
                    username=self.settings.smtp_user or None,
                    password=self.settings.smtp_password or None,
                    start_tls=self.settings.smtp_port != 465,
                    use_tls=self.settings.smtp_port == 465,
                    timeout=8,
                )
                return
            except (aiosmtplib.SMTPException, OSError):
                if attempt == 2:
                    raise AppError(
                        503,
                        "EMAIL_UNAVAILABLE",
                        "Email could not be delivered. Please try again later.",
                    ) from None
                await asyncio.sleep(0.1 * (attempt + 1))
