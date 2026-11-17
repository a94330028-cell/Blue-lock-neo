"""NEO 2.0: tests for compact current patch and safe full-package size audit."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("neo_v2_release_guard",ROOT/"tools/neo_v2_release_guard.py")
guard=importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


class V2ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.change=json.loads((ROOT/"CHANGELOG.json").read_text(encoding="utf-8"))
        self.version=(ROOT/"web/VERSION").read_text().strip()

    def test_latest_patch_small_and_history_preserved(self):
        report=guard.audit_release(self.change,self.version)
        self.assertEqual(report["version"],"2.0.0")
        self.assertLessEqual(report["items"],guard.MAX_PATCH_ITEMS)
        self.assertLessEqual(report["characters"],guard.MAX_PATCH_CHARS)
        self.assertIn("1.8.0", [x["version"] for x in self.change["releases"]])

    def test_overgrown_current_patch_rejected(self):
        fake=copy.deepcopy(self.change)
        fake["releases"][0]["novidades"].extend("Nota extra "+str(i) for i in range(20))
        with self.assertRaisesRegex(ValueError,"Patch gigante"):
            guard.audit_release(fake,self.version)

    def test_history_is_not_allowed_to_disappear(self):
        fake=copy.deepcopy(self.change)
        fake["releases"]=[fake["releases"][0]]
        with self.assertRaisesRegex(ValueError,"histórico 1.x"):
            guard.audit_release(fake,self.version)

    def test_audit_counts_assets_updates_but_not_old_update_zips(self):
        with tempfile.TemporaryDirectory() as directory:
            web=Path(directory)
            (web/"updates").mkdir()
            (web/"assets/updates").mkdir(parents=True)
            (web/"index.html").write_bytes(b"a"*17)
            (web/"updates/old.zip").write_bytes(b"x"*2000)
            (web/"assets/updates/banner.png").write_bytes(b"y"*23)
            r=guard.audit_files(web)
            self.assertEqual(r["total_web_files"],2)
            self.assertEqual(r["uncompressed_bytes"],40)
            self.assertEqual(len(r["biggest"]),2)

    def test_native_update_contract_is_unchanged(self):
        native=(ROOT/"app/src/main/java/com/neoegoist/simulator/MainActivity.java").read_text()
        self.assertIn('HOST = "appassets.androidplatform.net"',native)
        self.assertIn('PREF_WEB_VERSION = "installed_web_version"',native)
        self.assertIn('BUNDLED_WEB_VERSION = "10.6.22"',native)
        self.assertIn("MAX_PACKAGE_BYTES = 32L * 1024 * 1024",native)
        self.assertIn("MAX_UNPACKED_BYTES = 96L * 1024 * 1024",native)


if __name__=="__main__":
    unittest.main()
