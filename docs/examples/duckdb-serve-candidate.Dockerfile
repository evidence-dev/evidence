# Local security-review image only. Build from a context containing a Linux
# Evidence binary named "evidence"; see docs/duckdb-serve-deployment.md.
# Unlike cli/Dockerfile, this does NOT download a published CLI release.
FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 evidence \
    && mkdir -p /project \
    && chown evidence:evidence /project

COPY --chmod=755 evidence /usr/local/bin/evidence

USER 10001
WORKDIR /project
EXPOSE 3000

ENV EVIDENCE_TELEMETRY_DISABLED=1

ENTRYPOINT ["/usr/local/bin/evidence"]
CMD ["serve", "--host", "0.0.0.0", "--port", "3000", "--no-open"]
