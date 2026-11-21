#!/usr/bin/env python3
"""Prepare an Android release identity for its owner, entirely offline.

PRIVATE OUTPUT. Never commit the generated .p12, secrets file or backup ZIP.
This utility is for *initial* setup, not for routine releases. Every execution
generates a different certificate and therefore cannot update installations
signed with a previous identity.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import os
from pathlib import Path
import re
import secrets
import subprocess
import zipfile


def prepare(directory: Path) -> tuple[str, Path]:
    directory = directory.resolve()
    if not directory.is_dir() or any(directory.iterdir()):
        raise SystemExit("Use uma pasta privada existente e vazia.")
    directory.chmod(0o700)

    alias = "bluelockneo-release"
    password = secrets.token_urlsafe(48)
    store = directory / "Blue-Lock-NEO-RELEASE-PRIVATE.p12"
    env = {**os.environ, "NEO_RELEASE_SECRET": password}
    subprocess.run(
        [
            "keytool", "-genkeypair", "-noprompt",
            "-keystore", str(store), "-storetype", "PKCS12",
            "-alias", alias, "-keyalg", "RSA", "-keysize", "4096",
            "-validity", "10000",
            "-dname", "CN=Blue Lock NEO, O=Dezinho, C=BR",
            "-storepass:env", "NEO_RELEASE_SECRET",
            "-keypass:env", "NEO_RELEASE_SECRET",
        ],
        check=True,
        env=env,
        stdout=subprocess.DEVNULL,
    )
    store.chmod(0o600)
    detail = subprocess.check_output(
        ["keytool", "-list", "-v", "-keystore", str(store),
         "-storepass:env", "NEO_RELEASE_SECRET"],
        env=env, text=True,
    )
    match = re.search(r"SHA256:\s*([0-9A-Fa-f:]{95})", detail)
    if not match:
        raise RuntimeError("Não foi possível validar a impressão digital SHA-256 do certificado.")
    fingerprint = match.group(1).upper()
    encoded = base64.b64encode(store.read_bytes()).decode("ascii")

    howto = (
        "BACKUP PRIVADO DA ASSINATURA DO BLUE LOCK NEO\n"
        "NUNCA envie este ZIP, a chave .p12 ou o arquivo GITHUB-SECRETS.txt para jogadores.\n"
        "Nunca adicione estes arquivos ao Git ou a um site público.\n"
        "\n"
        "1. Guarde este ZIP permanentemente em local privado, fora do GitHub público.\n"
        "2. Em GitHub > Settings > Secrets and variables > Actions, crie\n"
        "   os quatro segredos listados em GITHUB-SECRETS.txt.\n"
        "3. Use SEMPRE esta mesma chave em todas as versões futuras.\n"
        "4. Jogadores de APKs antigos com certificado diferente devem exportar\n"
        "   backup da liga E dos retratos antes de desinstalar.\n"
        "5. A assinatura não pode ser substituída se você perder esta chave.\n"
        f"\nSHA-256 público do certificado: {fingerprint}\n"
    )
    credentials = (
        f"BL_KEYSTORE_BASE64={encoded}\n"
        f"BL_SIGNING_STORE_PASSWORD={password}\n"
        f"BL_SIGNING_KEY_ALIAS={alias}\n"
        f"BL_SIGNING_KEY_PASSWORD={password}\n"
    )
    archive = directory / "BLUE_LOCK_NEO_ASSINATURA_PRIVADA_NAO_COMPARTILHAR.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as output:
        output.write(store, arcname=store.name)
        output.writestr("GITHUB-SECRETS.txt", credentials)
        output.writestr("LEIA-PRIMEIRO.txt", howto)
    archive.chmod(0o600)
    # Recheck the generated ZIP without printing or exposing any credentials.
    with zipfile.ZipFile(archive) as check:
        assert set(check.namelist()) == {
            store.name, "GITHUB-SECRETS.txt", "LEIA-PRIMEIRO.txt"
        }
        assert hashlib.sha256(check.read(store.name)).digest() == hashlib.sha256(store.read_bytes()).digest()
    return fingerprint, archive


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    options = parser.parse_args()
    sha, target = prepare(options.output)
    print(f"CERT_SHA256={sha}")  # This fingerprint is public; never print passwords.
    print(f"PRIVATE_ARCHIVE={target}")
