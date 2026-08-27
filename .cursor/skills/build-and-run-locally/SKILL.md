---
name: build-and-run-locally
description: Build and run KeyStore Explorer (KSE) locally with the Gradle wrapper. Use when the user asks to build, compile, run, start, launch, or boot the app locally, or mentions ./gradlew, kse.jar, or running KSE from source.
---

# Build and run KSE locally

KeyStore Explorer is a **Swing desktop GUI**, not a web server. There is no localhost URL. Success means a KSE window opens.

Work from `kse/` using the wrapper (`kse/gradlew`). Do not invent Maven, npm, or Docker for the desktop app.

## Prerequisites

- JDK **17 or higher** (`java -version`). Builds are tested with 17, 21, and 25.
- Source/target Java level is 17 (`kse/build.gradle.kts`).
- Main class: `org.kse.KSE`.

If `java` is missing or below 17, stop and tell the user to install a JDK 17+ rather than guessing a package manager.

## Run (default)

When the user wants the app running:

1. Confirm JDK 17+.
2. Start Gradle in the background from `kse/` (GUI is long-running; do not block on it):

```sh
./gradlew run
```

3. Confirm the process started. Do not wait for it to exit.

IDE alternative: run `org.kse.KSE` (IntelliJ config: `.run/KSE.run.xml`).

## Build

When the user wants a compile/test/package without launching the GUI:

```sh
./gradlew clean build
```

Runs unit tests and produces:

- `kse/build/libs/kse.jar`
- `kse/build/distributions/kse-<version>.tar`
- `kse/build/distributions/kse-<version>.zip`

Tests only:

```sh
./gradlew test
```

## Do not do this unless asked

These are **release/packaging** tasks, not local dev:

| Task | Notes |
|------|--------|
| `./gradlew zip` | Release ZIP; generates `kse.exe` — Windows-oriented |
| `./gradlew innosetup` | Windows installer |
| `./gradlew appbundler` | macOS app bundle |
| `./gradlew buildRpm` / `buildDeb` / `buildAppImage` | Linux packages; extra host tools |

Do not build `kse-launcher` (Rust Windows exe) or `kse-website` (Astro) unless the user asked for those specifically.

Website local run (only if asked): from `kse-website/`, `npm install` then `npm run dev`.
