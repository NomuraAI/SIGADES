-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Matikan RLS agar bisa dibaca oleh aplikasi (PENTING!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Seed Initial Users
INSERT INTO users (username, password, role, name) 
VALUES 
('LobarAdmin', '@Lombok1_1', 'admin', 'Administrator Bapperida'),
('LobarUser', '@Lombok2_2', 'user', 'Staff Perencanaan'),
('LobarView', '@Lombok3_3', 'viewer', 'Viewer Umum')
ON CONFLICT (username) DO NOTHING;

-- 4. Verifikasi Data
SELECT * FROM users;
