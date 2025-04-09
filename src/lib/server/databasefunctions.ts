// databasefunctions.ts
// This file should exclusively contain functions to obtain information from the database
// This will make it easy to switch out our database provider if needed

import { sql } from '@vercel/postgres';
import { DatabaseError, type Admin, type Employee, type EmployeeInfo, type HearingHistory } from '../MyTypes';
import { HearingDataOneEar, HearingScreening, PersonSex, UserHearingScreeningHistory } from '$lib/interpret';

// EMPLOYEES
/**
 * @deprecated use extractEmployeeInfoFromDatabase instead
**/
export async function getEmployeesFromDatabase(): Promise<Employee[]> {
    const employeeTable = await sql`SELECT * FROM Employee;`;

    const employees: Employee[] = employeeTable.rows.map(row => ({
        activeStatus: row.last_active,
        employeeID: row.employee_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        dob: row.date_of_birth,
        sex: row.sex
    }));

    return employees;
}

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

export async function extractEmployeeInfoFromDatabase(employeeID: string): Promise<EmployeeInfo> {
    const query = await sql`
        SELECT first_name, last_name, email, date_of_birth, last_active, sex
        FROM Employee
        WHERE employee_id = ${employeeID};
    `;

    if (query.rows.length === 0) {
        throw new DatabaseError("There was an issue accessing the employee data.");
    }

    const employeeRaw = query.rows[0];

    // interpret sex from lowercase version of database field
    const sexRaw = employeeRaw.sex.toLowerCase();
    const personSex: PersonSex = sexRaw === "male" ? PersonSex.Male : sexRaw === "female" ? PersonSex.Female : PersonSex.Other;

    // build and return employee info
    const employeeInfo: EmployeeInfo = {
        id: parseInt(employeeID),
        firstName: employeeRaw.first_name,
        lastName: employeeRaw.last_name,
        email: employeeRaw.email,
        dob: new Date(employeeRaw.dob),
        lastActive: new Date(employeeRaw.last_active),
        sex: personSex
    }

    return employeeInfo;
}

export async function extractEmployeeHearingScreeningsFromDatabase(employeeID: string): Promise<HearingScreening[]> {
    const dataQuery = await sql`
        SELECT d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, d.Hz_4000, d.Hz_6000, d.Hz_8000, h.ear, h.year
        FROM Has h
        JOIN Data d ON h.data_id = d.data_id
        WHERE h.employee_id = ${employeeID}
        ORDER BY h.year ASC;
    `;

    if (dataQuery.rows.length === 0) {
        throw new DatabaseError("Hearing data not found.");
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
            Number(row.hz_500) ?? null,
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
            const errorMessage = `Unexpected ear side: ${row.ear}. Please contact the database administrator to fix the ear sides to either 'left' or 'right'`;
            throw new DatabaseError(errorMessage);
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

export async function extractEmployeeHearingHistoryFromDatabase(employeeID: string): Promise<HearingHistory> {
    // get the hearing screenings
    const screenings: HearingScreening[] = await extractEmployeeHearingScreeningsFromDatabase(employeeID);
    const employeeInfo: EmployeeInfo = await extractEmployeeInfoFromDatabase(employeeID);

    const history: HearingHistory = {
        employee: employeeInfo,
        screenings
    };

    return history;
}

// ADMINS

export async function getAdminsFromDatabase(): Promise<Admin[]> {
    const adminTable = await sql`SELECT * FROM Administrator;`;

    const admins: Admin[] = adminTable.rows.map(row => ({
        name: row.name,
        email: row.userstring,
        id: row.id,
        isOP: row.isop,
        selected: false
    }));

    return admins;
}
