-- Use this to create the necessary tables for a Postgres database
-- This has only been tested with Neon with Vercel

CREATE TABLE administrator (
    id SERIAL PRIMARY KEY,
    userstring VARCHAR,
    name VARCHAR,
    isop BOOLEAN
);

CREATE TABLE data (
    data_id SERIAL PRIMARY KEY,
    hz_500 SMALLINT,
    hz_1000 SMALLINT,
    hz_2000 SMALLINT,
    hz_3000 SMALLINT,
    hz_4000 SMALLINT,
    hz_6000 SMALLINT,
    hz_8000 SMALLINT,
    CONSTRAINT chk_data_range CHECK (
        (hz_500 BETWEEN -10 AND 90) AND
        (hz_1000 BETWEEN -10 AND 90) AND
        (hz_2000 BETWEEN -10 AND 90) AND
        (hz_3000 BETWEEN -10 AND 90) AND
        (hz_4000 BETWEEN -10 AND 90) AND
        (hz_6000 BETWEEN -10 AND 90) AND
        (hz_8000 BETWEEN -10 AND 90)
    )
);

CREATE TABLE employee (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64),
    email VARCHAR(64) NOT NULL UNIQUE,
    date_of_birth TIMESTAMP NOT NULL,
    last_active TIMESTAMP,
    sex TEXT NOT NULL,
    CONSTRAINT employee_sex_check CHECK (sex IN ('male', 'female', 'other'))
);

CREATE TABLE has (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    data_id INTEGER,
    year INTEGER,
    ear VARCHAR(5),
    CONSTRAINT unique_employee_year_ear UNIQUE (employee_id, year, ear),
    CONSTRAINT has_employee_id_fkey FOREIGN KEY (employee_id)
        REFERENCES public.employee (employee_id)
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT has_data_id_fkey FOREIGN KEY (data_id)
        REFERENCES public.data (data_id)
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);