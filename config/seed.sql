-- PostgreSQL initialization for modules/Agents/ModelRAGAgent.py
-- Apply this script manually in the target pgvector database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS model_assets (
	model_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	model_name TEXT NOT NULL UNIQUE,
	description TEXT NOT NULL,
	minio_bucket TEXT NOT NULL,
	minio_object_key TEXT NOT NULL,
	embedding VECTOR(1024) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE model_assets
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE model_assets
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_model_assets_embedding_hnsw
ON model_assets
USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION similarity_search_models(
	query_embedding vector(1024),
	match_count INT DEFAULT 10
)
RETURNS TABLE (
	model_id UUID,
	model_name TEXT,
	description TEXT,
	minio_bucket TEXT,
	minio_object_key TEXT,
	cosine_distance DOUBLE PRECISION,
	similarity_score DOUBLE PRECISION
)
LANGUAGE SQL
AS $$
	SELECT
		ma.model_id,
		ma.model_name,
		ma.description,
		ma.minio_bucket,
		ma.minio_object_key,
		(ma.embedding <=> query_embedding) AS cosine_distance,
		GREATEST(0, 1 - (ma.embedding <=> query_embedding)) AS similarity_score
	FROM model_assets AS ma
	ORDER BY ma.embedding <=> query_embedding
	LIMIT LEAST(match_count, 100);
$$;

-- Optional verification after inserting sample data:
-- SELECT *
-- FROM similarity_search_models(array_fill(0.0::real, ARRAY[1024])::vector(1024), 5);
