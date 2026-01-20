ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS data_version text DEFAULT 'Default';

-- Update existing rows to have text 'Default' if they are null (though default handles new ones)
UPDATE projects SET data_version = 'Default' WHERE data_version IS NULL;
