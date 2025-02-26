// databasefunctions.ts
// This file should exclusively contain functions to obtain information from the database
// This will make it easy to switch out our database provider if needed

import { sql } from '@vercel/postgres';
import { DatabaseError } from './MyTypes';

// EMPLOYEES

export async function insertEmployeeIntoDatabase(firstName: string, lastName: string, email: string, dateOfBirth: string, sex: string, lastActive: string | null) {
    const result = await sql`
        INSERT INTO Employee (first_name, last_name, email, date_of_birth, sex, last_active)
        VALUES (${firstName}, ${lastName}, ${email}, ${dateOfBirth}, ${sex}, ${lastActive});
    `;

    if (result.rowCount === 0) {
        throw new DatabaseError("Unable to insert rows into database.");
    }
}

// ADMINS