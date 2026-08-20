#!/bin/sh
# Evidence CLI installer
# Usage: curl -fsSL <url>/cli/install.sh | sh

set -e

BLOB_BASE="https://gaamozau3jchzs3r.public.blob.vercel-storage.com/cli"

# --- Detect platform ---

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin) os="darwin" ;;
  Linux)  os="linux" ;;
  *)
    echo "Error: Unsupported operating system: $OS"
    echo "Supported: macOS (Darwin), Linux"
    exit 1
    ;;
esac

case "$ARCH" in
  arm64|aarch64) arch="arm64" ;;
  x86_64|amd64)  arch="x64" ;;
  *)
    echo "Error: Unsupported architecture: $ARCH"
    echo "Supported: arm64/aarch64, x86_64/amd64"
    exit 1
    ;;
esac

PLATFORM="${os}-${arch}"
BINARY_NAME="evidence-${PLATFORM}"

echo "  Detected platform: ${PLATFORM}"

# --- Fetch latest version ---

echo "  Fetching latest version..."
VERSION_JSON="$(curl -fsSL "${BLOB_BASE}/version.json")"
VERSION="$(echo "$VERSION_JSON" | sed -n 's/.*"latest"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"

if [ -z "$VERSION" ]; then
  echo "Error: Could not determine latest version."
  exit 1
fi

echo "  Latest version: v${VERSION}"

# --- Get binary URL from version.json ---

BINARY_URL="$(echo "$VERSION_JSON" | sed -n "s/.*\"${PLATFORM}\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -1)"

if [ -z "$BINARY_URL" ]; then
  echo "Error: No binary available for ${PLATFORM}."
  exit 1
fi

# --- Download binary ---

TMPDIR="${TMPDIR:-/tmp}"
TMP_FILE="${TMPDIR}/evidence-download-$$"
cleanup() { rm -f "$TMP_FILE"; }
trap cleanup EXIT

TOTAL=$(curl -fsSLI "$BINARY_URL" | tr -d '\r' | awk '/^[Cc]ontent-[Ll]ength:/{print $2}' | tail -1)
curl -fsSL "$BINARY_URL" -o "$TMP_FILE" &
CURL_PID=$!
while kill -0 "$CURL_PID" 2>/dev/null; do
  if [ -f "$TMP_FILE" ] && [ "${TOTAL:-0}" -gt 0 ] 2>/dev/null; then
    SIZE=$(wc -c < "$TMP_FILE" 2>/dev/null | tr -d ' ')
    PCT=$((SIZE * 100 / TOTAL))
    printf "\r  Downloading Evidence CLI v${VERSION}... %d%%" "$PCT"
  fi
  sleep 0.2
done
wait "$CURL_PID"
printf "\r  Downloading Evidence CLI v${VERSION}... done  \n"

# --- Verify checksum ---

CHECKSUM="$(echo "$VERSION_JSON" | sed -n "s/.*\"${PLATFORM}\"[[:space:]]*:[[:space:]]*\"\([a-f0-9]\{64\}\)\".*/\1/p" | tail -1)"

if [ -n "$CHECKSUM" ]; then
  ACTUAL="$(shasum -a 256 "$TMP_FILE" 2>/dev/null | awk '{print $1}' \
    || sha256sum "$TMP_FILE" 2>/dev/null | awk '{print $1}')"
  if [ "$ACTUAL" != "$CHECKSUM" ]; then
    echo "  ✖ Checksum mismatch (expected ${CHECKSUM}, got ${ACTUAL})."
    echo "  The download may be corrupted. Please try again."
    rm -f "$TMP_FILE"
    exit 1
  fi
  echo "  ✔ Checksum verified"
fi

chmod +x "$TMP_FILE"

# --- Install ---

install_to() {
  INSTALL_DIR="$1"
  mkdir -p "$INSTALL_DIR"

  mv "$TMP_FILE" "${INSTALL_DIR}/evidence"
  chmod +x "${INSTALL_DIR}/evidence"

  # Create evd alias
  ln -sf "${INSTALL_DIR}/evidence" "${INSTALL_DIR}/evd"

  echo "  ✔ Installed to ${INSTALL_DIR}/evidence"
  echo "  ✔ Created alias: ${INSTALL_DIR}/evd"
}

# Try /usr/local/bin first
if [ -w "/usr/local/bin" ]; then
  install_to "/usr/local/bin"
elif [ "$(id -u)" = "0" ]; then
  install_to "/usr/local/bin"
else
  # Try with sudo
  if command -v sudo >/dev/null 2>&1; then
    echo "  Installing to /usr/local/bin (requires sudo)..."
    sudo mkdir -p /usr/local/bin
    sudo mv "$TMP_FILE" /usr/local/bin/evidence
    sudo chmod +x /usr/local/bin/evidence
    sudo ln -sf /usr/local/bin/evidence /usr/local/bin/evd
    echo "  ✔ Installed to /usr/local/bin/evidence"
    echo "  ✔ Created alias: /usr/local/bin/evd"
    INSTALL_DIR="/usr/local/bin"
  else
    # Fall back to ~/.local/bin
    INSTALL_DIR="${HOME}/.local/bin"
    install_to "$INSTALL_DIR"

    # Check if it's on PATH
    case ":$PATH:" in
      *":${INSTALL_DIR}:"*) ;;
      *)
        echo ""
        echo "  ⚠ ${INSTALL_DIR} is not on your PATH."
        echo "  Add it by running:"
        echo ""
        echo "    export PATH=\"${INSTALL_DIR}:\$PATH\""
        echo ""
        echo "  To make this permanent, add the line above to your ~/.bashrc, ~/.zshrc, or equivalent."
        ;;
    esac
  fi
fi

echo ""

EVD_IS_CI=""
if [ -n "$CI" ] && [ "$CI" != "false" ] && [ "$CI" != "0" ]; then
  EVD_IS_CI=1
elif [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ] || [ -n "$CIRCLECI" ] || [ -n "$BUILDKITE" ] || [ -n "$TF_BUILD" ] || [ -n "$JENKINS_URL" ]; then
  EVD_IS_CI=1
fi

EVD_OPTED_OUT=""
for flag in "$EVIDENCE_TELEMETRY_DISABLED" "$DO_NOT_TRACK"; do
  if [ -n "$flag" ] && [ "$flag" != "false" ] && [ "$flag" != "0" ]; then
    EVD_OPTED_OUT=1
  fi
done

if [ -z "$EVD_IS_CI" ] && [ -z "$EVD_OPTED_OUT" ]; then
  STUDIO_HOST="${PUBLIC_STUDIO_HOST:-https://evidence.studio}"

  EVD_DIR="${HOME}/.evd"
  MID_FILE="${EVD_DIR}/machine-id"
  MACHINE_ID=""
  if [ -f "$MID_FILE" ]; then
    MACHINE_ID="$(tr -d '[:space:]' < "$MID_FILE" 2>/dev/null)"
  fi
  if [ -z "$MACHINE_ID" ]; then
    MACHINE_ID="$(uuidgen 2>/dev/null | tr 'A-Z' 'a-z')"
    if [ -z "$MACHINE_ID" ]; then
      MACHINE_ID="$(od -An -N16 -tx1 /dev/urandom 2>/dev/null | tr -d ' \n')"
    fi
    if [ -n "$MACHINE_ID" ]; then
      mkdir -p "$EVD_DIR" 2>/dev/null \
        && printf '%s' "$MACHINE_ID" > "$MID_FILE" 2>/dev/null \
        && chmod 600 "$MID_FILE" 2>/dev/null
    fi
  fi

  if [ -n "$MACHINE_ID" ]; then
    curl -fsS -m 3 -X POST "${STUDIO_HOST}/api/cli/event" \
      -H 'content-type: application/json' \
      -d "{\"event\":\"cli_installed\",\"machineId\":\"${MACHINE_ID}\",\"properties\":{\"platform\":\"${PLATFORM}\",\"version\":\"${VERSION}\",\"install_method\":\"sh\"}}" \
      >/dev/null 2>&1 || true
  fi
fi

# Verify installation
if command -v evidence >/dev/null 2>&1; then
  echo "  $(evidence version)"
  echo ""
  echo "  Run 'evidence help' to get started."
else
  echo "  Run '${INSTALL_DIR:-/usr/local/bin}/evidence version' to verify."
  echo "  Run '${INSTALL_DIR:-/usr/local/bin}/evidence help' to get started."
fi
