-- Add service_type to catalog_items
ALTER TABLE "public"."catalog_items" ADD COLUMN "service_type" text;

-- Add catalog_item_id to document_lines
ALTER TABLE "public"."document_lines" ADD COLUMN "catalog_item_id" uuid;
ALTER TABLE "public"."document_lines" ADD CONSTRAINT "document_lines_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE SET NULL;
