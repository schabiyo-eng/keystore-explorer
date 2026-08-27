#!/usr/bin/env bash
#
# Idempotent dependency setup for the KeyStore Explorer Cloud Agent environment.
#
# Sets up the two runnable projects in this repo:
#   - kse          : the Java Swing desktop app (Gradle build, JDK 17+)
#   - kse-website  : the Astro static site (Node/npm)
#
# The Rust launcher (kse-launcher) is a Windows-only cross-compiled artifact and is
# intentionally not built here.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------------------------------------------------------------------------
# 1. Prime the Gradle wrapper distribution from the official GitHub mirror.
#
# gradle-wrapper.properties points distributionUrl at services.gradle.org, which is
# not on the Cloud Agent network egress allowlist. The identical official archive is
# published as a GitHub release asset (gradle/gradle-distributions), and github.com is
# allowlisted, so we fetch it there and prime the wrapper cache. Gradle derives the
# cache directory name from a base36-encoded MD5 of the distributionUrl string; we
# reproduce that here so ./gradlew resolves the distribution without any download.
# ---------------------------------------------------------------------------
seed_gradle_wrapper() {
  local props="$REPO_ROOT/kse/gradle/wrapper/gradle-wrapper.properties"
  local dist_url zip_name version hash dest mirror
  dist_url="$(sed -n 's/^distributionUrl=//p' "$props" | sed 's/\\:/:/g' | tr -d '\r')"
  zip_name="$(basename "$dist_url")"                                  # gradle-9.2.1-bin.zip
  version="$(echo "$zip_name" | sed -E 's/^gradle-(.*)-(bin|all)\.zip$/\1/')"

  hash="$(python3 - "$dist_url" <<'PY'
import hashlib, sys
digest = hashlib.md5(sys.argv[1].encode()).digest()
n = int.from_bytes(digest, "big")
alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
out = ""
while n:
    n, r = divmod(n, 36)
    out = alphabet[r] + out
print(out or "0")
PY
)"

  dest="${GRADLE_USER_HOME:-$HOME/.gradle}/wrapper/dists/${zip_name%.zip}/$hash"
  if [ -f "$dest/$zip_name.ok" ] && [ -d "$dest/gradle-$version" ]; then
    echo "[install] Gradle $version wrapper distribution already primed."
    return 0
  fi

  mkdir -p "$dest"
  rm -f "$dest"/*.part "$dest"/*.lck
  mirror="https://github.com/gradle/gradle-distributions/releases/download/v$version/$zip_name"
  echo "[install] Fetching Gradle $version from $mirror"
  curl -fsSL --retry 4 --retry-delay 4 -o "$dest/$zip_name" "$mirror"
  ( cd "$dest" && [ -d "gradle-$version" ] || unzip -q "$zip_name" )
  touch "$dest/$zip_name.ok"
  echo "[install] Gradle $version wrapper distribution primed at $dest"
}

# ---------------------------------------------------------------------------
# 2. Install the website (Astro) dependencies.
# ---------------------------------------------------------------------------
install_website() {
  echo "[install] Installing kse-website npm dependencies"
  ( cd "$REPO_ROOT/kse-website" && npm ci )
}

# ---------------------------------------------------------------------------
# 3. Build the Java app (best effort).
#
# buildSrc applies the external org.gradle.kotlin.kotlin-dsl plugin, which resolves
# only from the Gradle Plugin Portal (plugins.gradle.org). If that host is not on the
# egress allowlist the Gradle build cannot run at all, so we keep setup green (the
# website environment stays usable) and print exactly what to allowlist.
# ---------------------------------------------------------------------------
build_java() {
  echo "[install] Building kse (Java) with ./gradlew build"
  if ( cd "$REPO_ROOT/kse" && ./gradlew build --no-daemon ); then
    echo "[install] kse build succeeded."
  else
    cat <<'MSG'
[install] WARNING: the kse Gradle build failed.
[install] This is expected when plugins.gradle.org is not on the network egress
[install] allowlist -- buildSrc needs it to resolve the kotlin-dsl plugin.
[install] Add plugins.gradle.org (and services.gradle.org), or *.gradle.org, to the
[install] environment's allowed domains, then run:  cd kse && ./gradlew build
MSG
  fi
}

seed_gradle_wrapper
install_website
build_java
echo "[install] Done."
