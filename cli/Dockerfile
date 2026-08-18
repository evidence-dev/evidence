# Self-host `evidence serve` image.
#
# build:  docker build -t evidence-serve -f cli/Dockerfile .
# run:    docker run --rm -p 3000:3000 \
#           -e EVIDENCE_BASIC_USER=reports \
#           -e EVIDENCE_BASIC_PASSWORD=changeme \
#           -v /path/to/project:/project:ro \
#           evidence-serve
#
# The project mounted at /project must contain a connection.yaml (direct
# connector) — serve refuses to boot against the managed engine.
#
# To bake a project into the image instead of mounting it, see
# https://docs.evidence.studio/self-host

FROM debian:bookworm-slim AS install

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Pinned version keeps rebuilds reproducible; bump with the CLI release.
ARG EVIDENCE_VERSION=0.8.2
ARG TARGETARCH

RUN set -e; \
	case "$TARGETARCH" in \
		amd64) target=linux-x64 ;; \
		arm64) target=linux-arm64 ;; \
		*) echo "unsupported arch: $TARGETARCH" && exit 1 ;; \
	esac; \
	curl -fsSL "https://gaamozau3jchzs3r.public.blob.vercel-storage.com/cli/v${EVIDENCE_VERSION}/evidence-${target}" \
		-o /usr/local/bin/evidence; \
	chmod +x /usr/local/bin/evidence

FROM debian:bookworm-slim

# ca-certificates: without CA roots, TLS to the warehouse fails at runtime.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=install /usr/local/bin/evidence /usr/local/bin/evidence

RUN useradd --create-home --uid 10001 evidence \
	&& mkdir -p /project \
	&& chown evidence:evidence /project

USER evidence

WORKDIR /project

EXPOSE 3000

# Non-loopback --host makes EVIDENCE_BASIC_USER/PASSWORD mandatory at boot.
# Shell form so the PaaS-provided $PORT is honored; the binary ignores it.
CMD ["sh", "-c", "exec evidence serve --host 0.0.0.0 --no-open --port ${PORT:-3000}"]
