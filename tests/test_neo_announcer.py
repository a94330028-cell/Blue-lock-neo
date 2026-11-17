"""Unit tests for the NEO bot. No test sends a webhook."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("neo_announce", ROOT / "tools" / "neo_update_announcement.py")
announce = importlib.util.module_from_spec(spec)
spec.loader.exec_module(announce)


class UpdateAnnouncementTests(unittest.TestCase):
    def setUp(self):
        self.data = announce.load_changelog()
        self.version = self.data["current_version"]

    def test_source_is_official(self):
        self.assertEqual(self.data["project"], "Blue Lock NEO")
        self.assertEqual(self.version, (ROOT / "web/VERSION").read_text().strip())
        self.assertEqual(self.data["site_url"], announce.SITE_URL)
        self.assertEqual(self.data["releases"][0]["version"], self.version)

    def test_payload_includes_only_nonempty_fields_and_official_identity(self):
        packets = announce.build_payloads(self.data, self.version)
        self.assertGreater(len(packets), 0)
        for payload in packets:
            self.assertEqual(payload["username"], announce.NAME)
            self.assertEqual(payload["allowed_mentions"], {"parse": []})
            self.assertEqual(payload["avatar_url"], announce.SITE_URL + self.data["media"]["avatar"]["path"])
            self.assertLessEqual(len(payload["embeds"]), 10)
            self.assertLessEqual(sum(announce.embed_length(e) for e in payload["embeds"]), 6000)
            for e in payload["embeds"]:
                self.assertEqual(e["color"], 0x175BFF)
                self.assertLessEqual(len(e["title"]), 256)
                self.assertLessEqual(len(e.get("fields", [])), 25)
                for f in e["fields"]:
                    self.assertTrue(f["value"].strip())
                    self.assertLessEqual(len(f["value"]), 1024)
                    self.assertLessEqual(len(f["name"]), 256)
        combined = json.dumps(packets, ensure_ascii=False)
        self.assertIn("⛩️ 𝐁𝐋𝐔𝐄 𝐋𝐎𝐂𝐊 : 𝐍𝐄𝐎", combined)
        self.assertIn("NEO", combined)
        self.assertIn("Desenvolvimento: Dezinho", combined)
        self.assertIn(announce.SITE_URL, combined)

    def test_missing_changelog_version_blocks_announcements(self):
        with self.assertRaises(announce.AnnouncementError):
            announce.build_payloads(self.data, "99.99.99")

    def test_invalid_and_duplicate_changelog_block(self):
        with tempfile.TemporaryDirectory() as d:
            file = Path(d) / "CHANGELOG.json"
            for variant in ([], [self.data["releases"][0], self.data["releases"][0]]):
                content = copy.deepcopy(self.data)
                content["releases"] = variant
                file.write_text(json.dumps(content), encoding="utf-8")
                with self.assertRaises(announce.AnnouncementError):
                    announce.load_changelog(file)

    def test_new_changelog_has_new_delivery_id_even_without_public_version_bump(self):
        first = announce.announcement_identity(self.data, self.version)
        self.assertEqual(first["version"], self.version)
        self.assertRegex(first["build"], r"^\d+\.\d+\.\d+$")
        altered = copy.deepcopy(self.data)
        altered["releases"][0]["novidades"].append("Novo comportamento registrado e validado.")
        newer = announce.announcement_identity(altered, self.version)
        self.assertNotEqual(first["id"], newer["id"])
        self.assertEqual(first["id"], announce.announcement_identity(self.data, self.version)["id"])
        self.assertEqual(len(first["digest"]), 16)
        self.assertIn("build-", first["id"])

    def test_media_missing_or_altered_blocks(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(announce.AnnouncementError):
                announce.verify_media(self.data, d)
            for obj in self.data["media"].values():
                path = Path(d) / obj["path"]
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(bytes.fromhex("89504e470d0a1a0a") + b"x" * 4096)
            with self.assertRaises(announce.AnnouncementError):
                announce.verify_media(self.data, d)

    def test_many_items_split_without_discord_limit(self):
        sample = copy.deepcopy(self.data)
        sample["releases"][0]["novidades"] = [
            "Novidade verificada de teste " + str(i) + " — " + ("funcionalidade " * 20)
            for i in range(130)
        ]
        packets = announce.build_payloads(sample, self.version)
        self.assertGreater(len(packets), 1)
        for packet in packets:
            self.assertLessEqual(sum(announce.embed_length(e) for e in packet["embeds"]), 6000)
            self.assertLessEqual(len(packet["embeds"]), 10)

    def test_mentions_sanitized(self):
        sample = copy.deepcopy(self.data)
        sample["releases"][0]["novidades"] = ["@everyone e @here jamais devem disparar notificações."]
        payload = json.dumps(announce.build_payloads(sample, self.version), ensure_ascii=False)
        self.assertNotIn("@everyone", payload)
        self.assertNotIn("@here", payload)

    def test_official_update_sections_are_verified_and_present(self):
        packets = announce.build_payloads(self.data, self.version)
        full = json.dumps(packets, ensure_ascii=False)
        for heading in ("𝐍𝐄𝐖 𝐂𝐎𝐍𝐓𝐄𝐍𝐓", "𝐈𝐌𝐏𝐑𝐎𝐕𝐄𝐌𝐄𝐍𝐓𝐒",
                        "𝐁𝐀𝐋𝐀𝐍𝐂𝐄", "𝐁𝐔𝐆 𝐅𝐈𝐗𝐄𝐒", "𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐌𝐄𝐍𝐓"):
            self.assertIn(heading, full)
        self.assertNotIn("[NOME DA NOVIDADE]", full)
        self.assertNotIn("[Correção Nº 01]", full)
        self.assertNotIn("DD/MM/AAAA", full)
        self.assertNotIn("🟢 BUFF", full, "No unverified buffs must be announced")
        self.assertNotIn("🔴 NERF", full, "No unverified nerfs must be announced")
        self.assertIn("🔵 REWORK", full)

    def test_mass_ping_is_disabled_even_with_old_environment_variable(self):
        from unittest.mock import patch
        for value in ("1", "0"):
            with patch.dict("os.environ", {"NEO_PING_EVERYONE": value}):
                packets = announce.build_payloads(self.data, self.version)
                self.assertGreater(len(packets), 0)
                self.assertNotIn("@everyone", json.dumps(packets, ensure_ascii=False))
                self.assertNotIn("@here", json.dumps(packets, ensure_ascii=False))
                for packet in packets:
                    self.assertEqual(packet["allowed_mentions"], {"parse": []})
                    self.assertNotIn("content", packet)

    def test_discord_announcement_has_real_binary_attachments(self):
        import io
        from unittest.mock import patch
        packets = announce.build_payloads(self.data, self.version)
        first = packets[0]
        self.assertEqual(first["embeds"][0]["image"]["url"], "attachment://neo-update-banner.png")
        self.assertEqual(first["embeds"][0]["thumbnail"]["url"], "attachment://neo-update-avatar.png")
        checked = []
        def fake_open(request, timeout):
            raw = request.data
            self.assertIn(b'filename="neo-update-banner.png"', raw)
            self.assertIn(b'filename="neo-update-avatar.png"', raw)
            self.assertIn(b'payload_json', raw)
            self.assertTrue(request.get_header('Content-type').startswith('multipart/form-data'))
            checked.append(True)
            reply = io.BytesIO(json.dumps({"id": "12345", "attachments": [],
                "embeds": [{"image": {"url": "https://cdn.discordapp.com/attachments/example/neo-update-banner.png"},
                            "thumbnail": {"url": "https://cdn.discordapp.com/attachments/example/neo-update-avatar.png"}}]
            }).encode("utf-8"))
            reply.status = 200
            return reply
        with patch.object(announce, "urlopen", side_effect=fake_open):
            self.assertEqual(announce.webhook_request(
                "https://discord.com/api/webhooks/123/token", first), "12345")
        self.assertEqual(checked, [True])

    def test_preview_creates_file_but_not_network_request(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "preview.json"
            self.assertEqual(announce.run_cli(["preview", "--output", str(output)]), 0)
            self.assertEqual(json.loads(output.read_text())[0]["username"], announce.NAME)

    def test_script_avoids_leaking_webhook(self):
        source = (ROOT / "tools/neo_update_announcement.py").read_text(encoding="utf-8")
        self.assertIn("DISCORD_WEBHOOK_URL", source)
        self.assertNotIn("https://discord.com/api/webhooks/123", source)
        self.assertIn("neo-updates/", source)
        self.assertIn('verify_live_version(version)', source)


if __name__ == "__main__":
    unittest.main()
