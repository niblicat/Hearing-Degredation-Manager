// databasefunctions.ts
// This file should exclusively contain functions to obtain information from the database
// This will make it easy to switch out our database provider if needed

import { sql } from '@vercel/postgres';
import { DatabaseError, type Admin, type Employee, type EmployeeInfo, type HearingHistory } from '../MyTypes';
import { type HearingDataOneEar, type HearingScreening, PersonSex, UserHearingScreeningHistory } from '$lib/interpret';

// EMPLOYEES
/**
 * @deprecated use getEmployeeInfosFromDataBase instead
**/
export async function getEmployeesFromDatabase(): Promise<Employee[]> {
    const query = await sql`SELECT * FROM Employee;`;

    const employees: Employee[] = query.rows.map(row => ({
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
    const query = await sql`
        INSERT INTO Employee (first_name, last_name, email, date_of_birth, sex, last_active)
        VALUES (${firstName}, ${lastName}, ${email}, ${dateOfBirth}, ${sex}, ${lastActive});
    `;

    if (query.rowCount === 0) {
        throw new DatabaseError("Unable to insert rows into database.");
    }
}

export async function checkEmployeeExists(employeeID: string) {
    const query = await sql`
        SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};
    `;

    if (query.rows.length === 0) {
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

    const lastActive: null | Date = employeeRaw.last_active ? new Date(employeeRaw.last_active) : null;

    // build and return employee info
    const employeeInfo: EmployeeInfo = {
        id: parseInt(employeeID),
        firstName: employeeRaw.first_name,
        lastName: employeeRaw.last_name,
        email: employeeRaw.email,
        dob: new Date(employeeRaw.date_of_birth),
        lastActive: lastActive,
        sex: personSex
    }

    return employeeInfo;
}

export async function extractEmployeeInfosFromDatabase(): Promise<EmployeeInfo[]> {
    const query = await sql`SELECT * FROM Employee;`;

    const employeesRaw = query.rows;

    const employeeInfos: EmployeeInfo[] = employeesRaw.map((employeeRaw) => {
        // interpret sex from lowercase version of database field
        const sexRaw = employeeRaw.sex.toLowerCase();
        const personSex: PersonSex = sexRaw === "male" ? PersonSex.Male : sexRaw === "female" ? PersonSex.Female : PersonSex.Other;

        const lastActive: null | Date = employeeRaw.last_active ? new Date(employeeRaw.last_active) : null;

        const employeeInfo: EmployeeInfo = {
            id: parseInt(employeeRaw.employee_id),
            firstName: employeeRaw.first_name,
            lastName: employeeRaw.last_name,
            email: employeeRaw.email,
            dob: new Date(employeeRaw.date_of_birth),
            lastActive: lastActive,
            sex: personSex
        }
        return employeeInfo;
    })

    return employeeInfos;
}

export async function extractEmployeeHearingScreeningFromDatabase(employeeID: string, year: string): Promise<HearingScreening> {
    // this query will return 0 or 2 rows (left and right ears)
    const query = await sql`
        SELECT d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, d.Hz_4000, d.Hz_6000, d.Hz_8000, h.ear
        FROM Has h
        JOIN Data d ON h.data_id = d.data_id
        WHERE h.employee_id = ${employeeID} AND h.year = ${year};
    `;

    if (query.rows.length === 0) {
        throw new DatabaseError("Hearing data not found.");
    }

    const hearingDataByYear: Record<number, { leftEar: (number | null)[], rightEar: (number | null)[] }> = {};

    query.rows.forEach(row => {
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
            const errorMessage = `Unexpected ear side: ${row.ear}. Please contact the database administrator to fix the ear sides to either 'left' or 'right'`;
            throw new Error(errorMessage);
        }
    });

    const yearData = Object.entries(hearingDataByYear)[0]; // Get the first entry (or the only one)
    const [obtainedYear, ears] = yearData;

    const leftEarData = ears.leftEar;
    const rightEarData = ears.rightEar;

    // Populate left and right ear hearing data
    const leftEar: HearingDataOneEar = {
        hz500: leftEarData[0] ?? null,
        hz1000: leftEarData[1] ?? null,
        hz2000: leftEarData[2] ?? null,
        hz3000: leftEarData[3] ?? null,
        hz4000: leftEarData[4] ?? null,
        hz6000: leftEarData[5] ?? null,
        hz8000: leftEarData[6] ?? null
    };

    const rightEar: HearingDataOneEar = {
        hz500: rightEarData[0] ?? null,
        hz1000: rightEarData[1] ?? null,
        hz2000: rightEarData[2] ?? null,
        hz3000: rightEarData[3] ?? null,
        hz4000: rightEarData[4] ?? null,
        hz6000: rightEarData[5] ?? null,
        hz8000: rightEarData[6] ?? null
    };

    // Convert fetched data into HearingScreening object
    const screening: HearingScreening = {
        year: Number(year),
        leftEar,
        rightEar
    }

    return screening;
}

export async function checkEmployeeHearingScreeningFromDatabase(employeeID: string, year: string): Promise<boolean> {
    // this query will return 0 or 2 rows (left and right ears)
    const query = await sql`
        SELECT d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, d.Hz_4000, d.Hz_6000, d.Hz_8000, h.ear
        FROM Has h
        JOIN Data d ON h.data_id = d.data_id
        WHERE h.employee_id = ${employeeID} AND h.year = ${year};
    `;

    return query.rows.length !== 0;
}

export async function extractEmployeeHearingScreeningsFromDatabase(employeeID: string): Promise<HearingScreening[]> {
    const query = await sql`
        SELECT d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, d.Hz_4000, d.Hz_6000, d.Hz_8000, h.ear, h.year
        FROM Has h
        JOIN Data d ON h.data_id = d.data_id
        WHERE h.employee_id = ${employeeID}
        ORDER BY h.year ASC;
    `;

    // may not necessarily be an error
    // let handlers determine if it's a problem by checking the array length
    if (query.rows.length === 0) {
        console.log(`No hearing data found for employee with ID ${employeeID}. This may be fine if the employee has no submitted audiograms.`);
        return [];
    }

    const hearingDataByYear: Record<number, { leftEar: (number | null)[], rightEar: (number | null)[] }> = {};

    query.rows.forEach(row => {
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
            throw new Error(errorMessage);
        }
    });
    
    // Convert fetched data into HearingScreening objects
    const screenings: HearingScreening[] = Object.entries(hearingDataByYear).map(([year, ears]) => {
        const leftEarData = ears.leftEar;
        const rightEarData = ears.rightEar;

        // Populate left and right ear hearing data
        const leftEar: HearingDataOneEar = {
            hz500: leftEarData[0] ?? null,
            hz1000: leftEarData[1] ?? null,
            hz2000: leftEarData[2] ?? null,
            hz3000: leftEarData[3] ?? null,
            hz4000: leftEarData[4] ?? null,
            hz6000: leftEarData[5] ?? null,
            hz8000: leftEarData[6] ?? null
        };

        const rightEar: HearingDataOneEar = {
            hz500: rightEarData[0] ?? null,
            hz1000: rightEarData[1] ?? null,
            hz2000: rightEarData[2] ?? null,
            hz3000: rightEarData[3] ?? null,
            hz4000: rightEarData[4] ?? null,
            hz6000: rightEarData[5] ?? null,
            hz8000: rightEarData[6] ?? null
        };

        return {
            year: Number(year),
            leftEar,
            rightEar
        };
    });

    return screenings;
}

export async function extractEmployeeHearingHistoryFromDatabase(employeeInfo: EmployeeInfo): Promise<HearingHistory> {
    // get the hearing screenings
    const screenings: HearingScreening[] = await extractEmployeeHearingScreeningsFromDatabase(employeeInfo.id.toString());

    const history: HearingHistory = {
        employee: employeeInfo,
        screenings
    };

    return history;
}

export async function addHearingScreeningToDatabase(employeeInfo: EmployeeInfo, screening: HearingScreening): Promise<void> {
    // **Validation 1: Ensure the year is within employment period**
    const currentYear = new Date().getFullYear();

    if (employeeInfo.lastActive === null) {
        // Employee is still active
        if (screening.year > currentYear || screening.year < 1957) {
            throw new Error("Cannot add hearing data for invalid year range.");
        }
    }
    else {
        // Employee is inactive
        const lastActiveYear = new Date(employeeInfo.lastActive).getFullYear();
        if (screening.year > lastActiveYear || screening.year < 1957) {
            throw new Error(`Cannot add hearing data after employment ended in ${lastActiveYear}.`);
        }
    }

    // **Validation 2: Ensure only one set of hearing data per year**
    const existingDataQuery = await sql`
        SELECT 1 FROM Has 
        WHERE employee_id = ${employeeInfo.id} AND year = ${screening.year}
        LIMIT 1;
    `;

    if (existingDataQuery.rows.length > 0)
        throw new DatabaseError(`Hearing data for the year ${screening.year} already exists for this employee.`);

    // Insert left ear data into Data table
    const leftEarDataQuery = await sql`
        INSERT INTO Data (Hz_500, Hz_1000, Hz_2000, Hz_3000, Hz_4000, Hz_6000, Hz_8000)
        VALUES (${screening.leftEar.hz500}, ${screening.leftEar.hz1000}, 
                ${screening.leftEar.hz2000}, ${screening.leftEar.hz3000}, 
                ${screening.leftEar.hz4000}, ${screening.leftEar.hz6000}, 
                ${screening.leftEar.hz8000})
        RETURNING data_id;
    `;

    const leftEarDataID = leftEarDataQuery.rows[0].data_id;

    // Insert right ear data into Data table
    const rightEarDataQuery = await sql`
        INSERT INTO Data (Hz_500, Hz_1000, Hz_2000, Hz_3000, Hz_4000, Hz_6000, Hz_8000)
        VALUES (${screening.rightEar.hz500}, ${screening.rightEar.hz1000}, 
                ${screening.rightEar.hz2000}, ${screening.rightEar.hz3000}, 
                ${screening.rightEar.hz4000}, ${screening.rightEar.hz6000}, 
                ${screening.rightEar.hz8000})
        RETURNING data_id;
    `;

    const rightEarDataID = rightEarDataQuery.rows[0].data_id;

    // Insert into Has table for right ear
    await sql`
        INSERT INTO Has (employee_id, data_id, year, ear)
        VALUES (${employeeInfo.id}, ${rightEarDataID}, ${screening.year}, 'right');
    `;

    // Insert into Has table for left ear
    await sql`
        INSERT INTO Has (employee_id, data_id, year, ear)
        VALUES (${employeeInfo.id}, ${leftEarDataID}, ${screening.year}, 'left');
    `;
}

export async function addHearingScreeningModifiedToDatabase(employeeInfo: EmployeeInfo, screening: HearingScreening): Promise<void> {
    // check if there is existing data for the left and right ears
    const existingLeftData = await sql`
        SELECT d.data_id FROM Data d
        JOIN Has h ON d.data_id = h.data_id
        WHERE h.employee_id = ${employeeInfo.id} AND h.year = ${screening.year} AND h.ear = 'left';
    `;

    const existingRightData = await sql`
        SELECT d.data_id FROM Data d
        JOIN Has h ON d.data_id = h.data_id
        WHERE h.employee_id = ${employeeInfo.id} AND h.year = ${screening.year} AND h.ear = 'right';
    `;

    // either insert or update left ear data
    if (existingLeftData.rows.length > 0) {
        // Update left ear data
        const leftDataId = existingLeftData.rows[0].data_id;
        await sql`
            UPDATE Data
            SET Hz_500 = ${screening.leftEar.hz500}, Hz_1000 = ${screening.leftEar.hz1000}, 
                Hz_2000 = ${screening.leftEar.hz2000}, Hz_3000 = ${screening.leftEar.hz3000}, 
                Hz_4000 = ${screening.leftEar.hz4000}, Hz_6000 = ${screening.leftEar.hz6000}, 
                Hz_8000 = ${screening.leftEar.hz8000}
            WHERE data_id = ${leftDataId};
        `;
    }
    else {
        // Insert new left ear data
        const leftEarDataResult = await sql`
            INSERT INTO Data (Hz_500, Hz_1000, Hz_2000, Hz_3000, Hz_4000, Hz_6000, Hz_8000)
            VALUES (${screening.leftEar.hz500}, ${screening.leftEar.hz1000},
                    ${screening.leftEar.hz2000}, ${screening.leftEar.hz3000},
                    ${screening.leftEar.hz4000}, ${screening.leftEar.hz6000},
                    ${screening.leftEar.hz8000})
            RETURNING data_id;
        `;
        const leftEarDataId = leftEarDataResult.rows[0].data_id;

        // Insert into Has table
        await sql`
            INSERT INTO Has (employee_id, data_id, year, ear)
            VALUES (${employeeInfo.id}, ${leftEarDataId}, ${screening.year}, 'left');
        `;
    }

    // either insert or update right ear data
    if (existingRightData.rows.length > 0) {
        // Update right ear data
        const rightDataId = existingRightData.rows[0].data_id;
        await sql`
            UPDATE Data
            SET Hz_500 = ${screening.rightEar.hz500}, Hz_1000 = ${screening.rightEar.hz1000}, 
                Hz_2000 = ${screening.rightEar.hz2000}, Hz_3000 = ${screening.rightEar.hz3000}, 
                Hz_4000 = ${screening.rightEar.hz4000}, Hz_6000 = ${screening.rightEar.hz6000}, 
                Hz_8000 = ${screening.rightEar.hz8000}
            WHERE data_id = ${rightDataId};
        `;
    }
    else {
        // Insert new right ear data
        const rightEarDataResult = await sql`
            INSERT INTO Data (Hz_500, Hz_1000, Hz_2000, Hz_3000, Hz_4000, Hz_6000, Hz_8000)
            VALUES (${screening.rightEar.hz500}, ${screening.rightEar.hz1000},
                    ${screening.rightEar.hz2000}, ${screening.rightEar.hz3000},
                    ${screening.rightEar.hz4000}, ${screening.rightEar.hz6000},
                    ${screening.rightEar.hz8000})
            RETURNING data_id;
        `;
        const rightEarDataId = rightEarDataResult.rows[0].data_id;

        // Insert into Has table
        await sql`
            INSERT INTO Has (employee_id, data_id, year, ear)
            VALUES (${employeeInfo.id}, ${rightEarDataId}, ${screening.year}, 'right');
        `;
    }
}

// ADMINS

export async function isEmailAnAdmin(email: string): Promise<boolean> {
    const query = await sql`SELECT isop::boolean FROM Administrator WHERE userstring=${email};`

    if (query.rows.length === 0) throw new DatabaseError("User does not exist on Administrator table.");

    const isOpRaw: boolean = query.rows[0].isop;

    return isOpRaw;
}

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

export async function modifyAdminPermissionsFromDatabase(adminID: string, isOP: boolean) {
    const query = await sql`UPDATE Administrator SET isop = ${isOP} WHERE id=${adminID};`
    
    if (query.rowCount === 0) throw new DatabaseError("No rows were updated. Admin ID might be incorrect.");
}

export async function modifyAdminNameFromDatabase(adminID: string, newName: string) {
    const query = await sql`UPDATE Administrator SET name = ${newName} WHERE id=${adminID};`
    
    if (query.rowCount === 0) throw new DatabaseError("No rows were updated. Admin ID might be incorrect.");
}

export async function deleteAdminsFromDatabase(adminIDs: string[]) {
    const formattedAdminIDs = `{"${adminIDs.join('","')}"}`;

    const query = await sql`
        DELETE FROM Administrator
        WHERE id = ANY(${formattedAdminIDs});
    `;

    // Check if any rows were deleted
    if (query.rowCount === 0)  throw new DatabaseError("No rows were updated. Admin ID might be incorrect.");
}