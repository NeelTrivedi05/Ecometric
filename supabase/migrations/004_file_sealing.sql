-- Migration 004: File Sealing — Ed25519 provenance registry
-- Adds file_seals, seal_keys, and seal_verification_log tables.
-- Safe to run on a fresh or existing database; uses IF NOT EXISTS guards.

-- ─────────────────────────────────────────────
-- 1. seal_keys: public key registry (no private material)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seal_keys (
    key_id          TEXT        PRIMARY KEY,
    purpose         TEXT        NOT NULL CHECK (purpose IN ('signing', 'kek')),
    public_key_b64  TEXT,           -- Ed25519 public key, base64url (signing keys only)
    status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    retired_at      TIMESTAMPTZ
);

COMMENT ON TABLE public.seal_keys IS
    'Public key registry for Ed25519 signing keys and KEK identifiers. '
    'Private key material is never stored here.';

-- ─────────────────────────────────────────────
-- 2. file_seals: provenance record per exported file
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.file_seals (
    certificate_id      TEXT        PRIMARY KEY,   -- ECM-XXXX-XXXX-XXXX-XXXX
    manifest_version    TEXT        NOT NULL DEFAULT '1',
    manifest            JSONB       NOT NULL,       -- full provenance snapshot (immutable)
    signature           TEXT        NOT NULL,       -- base64url Ed25519 sig over canonical manifest
    signing_key_id      TEXT        NOT NULL REFERENCES public.seal_keys(key_id),
    file_sha256         TEXT        NOT NULL,       -- sha256 hex of plaintext delivered file
    container_sha256    TEXT,                       -- sha256 hex of .ecmx container (NULL if signed-open)
    export_mode         TEXT        NOT NULL CHECK (export_mode IN ('sealed', 'signed_open')),
    status              TEXT        NOT NULL DEFAULT 'valid'
                            CHECK (status IN ('valid', 'revoked', 'superseded')),
    revoked_at          TIMESTAMPTZ,
    revoked_by          TEXT,                       -- user id (string, avoids auth.users dependency in SQLite)
    revoke_reason       TEXT,
    superseded_by       TEXT        REFERENCES public.file_seals(certificate_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_file_seals_file_sha256      ON public.file_seals (file_sha256);
CREATE INDEX IF NOT EXISTS idx_file_seals_container_sha256 ON public.file_seals (container_sha256);
CREATE INDEX IF NOT EXISTS idx_file_seals_status           ON public.file_seals (status);

COMMENT ON TABLE public.file_seals IS
    'Immutable provenance registry. One row per exported file. '
    'The manifest JSON is a snapshot at creation time; renames never rewrite history.';

-- ─────────────────────────────────────────────
-- 3. seal_verification_log: public endpoint audit (no PII)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seal_verification_log (
    id              TEXT        PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    verified_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    result          TEXT        NOT NULL
                        CHECK (result IN ('authentic', 'modified', 'not_found', 'revoked', 'superseded')),
    certificate_id  TEXT,                   -- nullable: may not be known from file-hash lookup
    ip_hash         TEXT,                   -- salted SHA-256 of remote IP — never the raw address
    user_agent_fam  TEXT                    -- browser/tool family only, no full UA string
);

CREATE INDEX IF NOT EXISTS idx_seal_vlog_verified_at     ON public.seal_verification_log (verified_at);
CREATE INDEX IF NOT EXISTS idx_seal_vlog_certificate_id  ON public.seal_verification_log (certificate_id);

COMMENT ON TABLE public.seal_verification_log IS
    'Audit log for the public /verify endpoint. '
    'Contains no file content, no file names, no raw IP addresses.';

