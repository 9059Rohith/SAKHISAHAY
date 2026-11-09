"""Loopback-only SMTP capture used by integration tests, never production."""

import asyncio
from email import policy
from email.parser import BytesParser


class SMTPCapture:
    def __init__(self):
        self.messages = []
        self.server = None
        self.port = None

    async def __aenter__(self):
        self.server = await asyncio.start_server(self.handle, "127.0.0.1", 0)
        self.port = self.server.sockets[0].getsockname()[1]
        return self

    async def __aexit__(self, *args):
        self.server.close()
        await self.server.wait_closed()

    async def handle(self, reader, writer):
        async def reply(value):
            writer.write(value.encode("ascii") + b"\r\n")
            await writer.drain()

        await reply("220 localhost test SMTP")
        try:
            while line := await reader.readline():
                command = line.decode("ascii").strip().upper()
                if command.startswith(("EHLO", "HELO")):
                    await reply("250-localhost\r\n250 SIZE 65536")
                elif command.startswith(("MAIL FROM:", "RCPT TO:", "RSET", "NOOP")):
                    await reply("250 OK")
                elif command == "DATA":
                    await reply("354 End with a dot")
                    content = bytearray()
                    while data := await reader.readline():
                        if data == b".\r\n":
                            break
                        content.extend(data[1:] if data.startswith(b"..") else data)
                    self.messages.append(BytesParser(policy=policy.default).parsebytes(content))
                    await reply("250 Message accepted by local test server")
                elif command == "QUIT":
                    await reply("221 Bye")
                    break
                else:
                    await reply("502 Unsupported test command")
        finally:
            writer.close()
            await writer.wait_closed()
