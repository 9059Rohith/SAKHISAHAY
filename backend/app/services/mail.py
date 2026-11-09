import asyncio
import json
import logging
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from html import escape

import aiosmtplib

from ..core.exceptions import AppError

logger = logging.getLogger("sakhisahay.mail")


class Mailer:
    DELIVERY_TIMEOUT_SECONDS = 12

    def __init__(self, settings):
        self.settings = settings

    @property
    def available(self):
        return bool(self.settings.smtp_host and self.settings.email_from)

    @property
    def transport(self):
        mode = self.settings.smtp_security
        return ("tls" if self.settings.smtp_port == 465 else "starttls") if mode == "auto" else mode

    async def send_link(self, recipient, purpose, link):
        if not self.available:
            raise AppError(
                503,
                "EMAIL_UNAVAILABLE",
                "Email delivery is not configured. Use your saved recovery code to reset your password.",
            )
        try:
            async with asyncio.timeout(self.DELIVERY_TIMEOUT_SECONDS):
                await self._deliver(recipient, purpose, link)
        except TimeoutError:
            logger.warning(
                json.dumps({"event": "email_delivery_failed", "error_type": "TimeoutError"})
            )
            raise AppError(
                503, "EMAIL_UNAVAILABLE", "Email delivery timed out. Please try again later."
            ) from None

    async def _deliver(self, recipient, purpose, link):
        msg = EmailMessage()
        msg["From"] = self.settings.email_from
        msg["To"] = recipient
        msg["Subject"] = f"SAKHISAHAY: {purpose}"
        msg["Date"] = formatdate(localtime=False, usegmt=True)
        msg["Message-ID"] = make_msgid()
        msg.set_content(
            f"{purpose}\n\nOpen this secure link: {link}\n\nThis one-time link expires in 30 minutes. If you did not request it, ignore this message. Never share this link or your password.\n\nSakhiSahay — together for safer tomorrows."
        )
        msg.add_alternative(
            f"""<!doctype html><html><body style="margin:0;background:#f5f0f8;font-family:Arial,sans-serif;color:#34263f"><main style="max-width:560px;margin:32px auto;padding:32px;background:#fff;border-radius:18px"><p style="color:#79558e;letter-spacing:2px">SAKHISAHAY</p><h1 style="font-family:Georgia,serif;font-weight:500">{escape(purpose)}</h1><p>Continue securely using the button below.</p><p style="margin:28px 0"><a href="{escape(link, quote=True)}" style="display:inline-block;padding:14px 22px;border-radius:10px;background:#79558e;color:#fff;text-decoration:none">{escape(purpose)}</a></p><p>This one-time link expires in 30 minutes.</p><p style="font-size:13px;color:#65576f">If you did not request this email, you can ignore it. Never share this link or your password.</p><hr style="border:0;border-top:1px solid #e9e3ee"><p style="font-family:Georgia,serif;color:#79558e">Together for safer tomorrows.</p></main></body></html>""",
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
                    start_tls=self.transport == "starttls",
                    use_tls=self.transport == "tls",
                    validate_certs=True,
                    timeout=8,
                )
                return
            except (aiosmtplib.SMTPException, OSError) as exc:
                if attempt == 2 or isinstance(exc, aiosmtplib.SMTPAuthenticationError):
                    logger.warning(
                        json.dumps(
                            {"event": "email_delivery_failed", "error_type": type(exc).__name__}
                        )
                    )
                    raise AppError(
                        503,
                        "EMAIL_UNAVAILABLE",
                        "Email could not be delivered. Please try again later.",
                    ) from None
                await asyncio.sleep(0.1 * (attempt + 1))
