-- Add projects and certificates columns to developers table
ALTER TABLE developers 
ADD COLUMN projects JSONB DEFAULT '[]'::jsonb,
ADD COLUMN certificates JSONB DEFAULT '[]'::jsonb;

-- Add indexes for JSONB columns for better query performance
CREATE INDEX idx_developers_projects ON developers USING GIN (projects);
CREATE INDEX idx_developers_certificates ON developers USING GIN (certificates);

-- Add comments for documentation
COMMENT ON COLUMN developers.projects IS 'Array of project objects with details about developer projects';
COMMENT ON COLUMN developers.certificates IS 'Array of certificate objects with details about developer certifications';

