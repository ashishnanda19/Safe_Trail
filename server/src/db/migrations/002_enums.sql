-- 002_enums.sql
-- Create all ENUM types

CREATE TYPE user_role AS ENUM ('user', 'volunteer', 'admin');
CREATE TYPE sos_status AS ENUM ('active', 'resolved', 'false_alarm');
CREATE TYPE guardian_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE alert_channel AS ENUM ('sms', 'push', 'email');
CREATE TYPE alert_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE incident_category AS ENUM ('harassment', 'stalking', 'assault', 'unsafe_area', 'other');
