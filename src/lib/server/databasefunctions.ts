// databasefunctions.ts
// This file should exclusively contain functions to obtain information from the database
// This will make it easy to switch out our database provider if needed

import { sql } from '@vercel/postgres';
import { DatabaseError } from '../MyTypes';
import { HearingDataOneEar, HearingScreening } from '$lib/interpret';

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

export async function checkEmployeeExists(employeeID: string) {
    const employeeCheck = await sql`
        SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};
    `;

    if (employeeCheck.rows.length === 0) {
        throw new DatabaseError("Employee not found");
    }
}

export async function extractEmployeeHearingDataFromDatabase(employeeID: string): Promise<HearingScreening[]> {
    checkEmployeeExists(employeeID); // will throw error if employee is not found

    const dataQuery = await sql`
        SELECT d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, d.Hz_4000, d.Hz_6000, d.Hz_8000, h.ear, h.year
        FROM Has h
        JOIN Data d ON h.data_id = d.data_id
        WHERE h.employee_id = ${employeeID}
        ORDER BY h.year ASC;
    `;

    if (dataQuery.rows.length === 0) {
        throw new DatabaseError("Hearing data not found");
    }

    const hearingDataByYear: Record<number, { leftEar: (number | null)[], rightEar: (number | null)[] }> = {};

    dataQuery.rows.forEach(row => {
        // Loop through each row of the query result to group data by year and
        // store frequency thresholds for each ear separately
        const yearKey = Number(row.year);
        const earSide = row.ear.trim().toLowerCase();  // Normalize ear value
    
        if (!hearingDataByYear[yearKey]) {
            hearingDataByYear[yearKey] = { leftEar: new Array(7).fill(0), rightEar: new Array(7).fill(0) };
        }
    
        const frequencies = [
            row.hz_500 === null ? null : Number(row.hz_500),
            row.hz_1000 === null ? null : Number(row.hz_1000),
            row.hz_2000 === null ? null : Number(row.hz_2000),
            row.hz_3000 === null ? null : Number(row.hz_3000),
            row.hz_4000 === null ? null : Number(row.hz_4000),
            row.hz_6000 === null ? null : Number(row.hz_6000),
            row.hz_8000 === null ? null : Number(row.hz_8000)
        ];
    
        if (earSide === 'right') {
            hearingDataByYear[yearKey].rightEar = frequencies;
        } else if (earSide === 'left') {
            hearingDataByYear[yearKey].leftEar = frequencies;
        } else {
            const errorMessage = `Unexpected ear value: ${row.ear}`;
            throw new Error(errorMessage);
        }
    });
    
    // Convert fetched data into HearingScreening objects
    const screenings: HearingScreening[] = Object.entries(hearingDataByYear).map(([year, ears]) => 
        new HearingScreening(
            Number(year),
            new HearingDataOneEar(
                ears.leftEar[0], ears.leftEar[1], ears.leftEar[2], ears.leftEar[3], 
                ears.leftEar[4], ears.leftEar[5], ears.leftEar[6]
            ),
            new HearingDataOneEar(
                ears.rightEar[0], ears.rightEar[1], ears.rightEar[2], ears.rightEar[3], 
                ears.rightEar[4], ears.rightEar[5], ears.rightEar[6]
            )
        )
    );

    return screenings;
}

// ADMINS