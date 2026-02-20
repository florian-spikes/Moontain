-- Add name column to document_lines table
ALTER TABLE document_lines ADD COLUMN name text NOT NULL DEFAULT '';
