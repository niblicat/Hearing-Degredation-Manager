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

export async function extractEmployeeHearingScreeningsFromDatabase(employeeID: string): Promise<HearingScreening[]> {
    const dataQuery = await sql`
        SELECT d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, d.Hz_4000, d.Hz_6000, d.Hz_8000, h.ear, h.year
        FROM Has h
        JOIN Data d ON h.data_id = d.data_id
        WHERE h.employee_id = ${employeeID}
        ORDER BY h.year ASC;
    `;

    // may not necessarily be an error
    // let handlers determine if it's a problem by checking the array length
    if (dataQuery.rows.length === 0) {
        console.log(`No hearing data found for employee with ID ${employeeID}. This may be fine if the employee has no submitted audiograms.`);
        return [];
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
    const result = await sql`UPDATE Administrator SET isop = ${isOP} WHERE id=${adminID};`
    
    if (result.rowCount === 0) throw new DatabaseError("No rows were updated. Admin ID might be incorrect.");
}

export async function modifyAdminNameFromDatabase(adminID: string, newName: string) {
    const result = await sql`UPDATE Administrator SET name = ${newName} WHERE id=${adminID};`
    
    if (result.rowCount === 0) throw new DatabaseError("No rows were updated. Admin ID might be incorrect.");
}

export async function deleteAdminsFromDatabase(adminIDs: string[]) {
    const formattedAdminIDs = `{"${adminIDs.join('","')}"}`;

    const result = await sql`
        DELETE FROM Administrator
        WHERE id = ANY(${formattedAdminIDs});
    `;

    // Check if any rows were deleted
    if (result.rowCount === 0)  throw new DatabaseError("No rows were updated. Admin ID might be incorrect.");
}