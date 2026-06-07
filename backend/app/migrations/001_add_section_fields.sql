create extension if not exists vector;
create extension if not exists pg_trgm;

alter table document_chunks
    add column if not exists section_title text not null default '',
    add column if not exists section_index integer not null default 0;

do $$
begin
    if not exists (
        select 1 from information_schema.columns
        where table_name = 'document_chunks' and column_name = 'fts_vector'
    ) then
        alter table document_chunks
        add column fts_vector tsvector generated always as (
            to_tsvector('english', coalesce(section_title, '') || ' ' || coalesce(content, ''))
        ) stored;
    end if;
end $$;

create index if not exists idx_document_chunks_fts on document_chunks using gin (fts_vector);
create index if not exists idx_document_chunks_content_trgm on document_chunks using gin (content gin_trgm_ops);
create index if not exists idx_document_chunks_section_title_trgm on document_chunks using gin (section_title gin_trgm_ops);
create index if not exists idx_document_chunks_document_index on document_chunks (document_id, chunk_index);
