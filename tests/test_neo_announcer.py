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
                self.assertEqual(e["color"], 0x00CFFF)
                self.assertLessEqual(len(e["title"]), 256)
                self.assertLessEqual(len(e.get("fields", [])), 25)
                for f in e["fields"]:
                    self.assertTrue(f["value"].strip())
                    self.assertLessEqual(len(f["value"]), 1024)
                    self.assertLessEqual(len(f["name"]), 256)
        combined = json.dumps(packets, ensure_ascii=False)
        self.assertIn("🚀 BLUE LOCK NEO", combined)
        self.assertIn("NEO", combined)
        self.assertIn("BLUE LOCK NEO • OFFICIAL UPDATE SYSTEM", combined)
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
