// actionshearingdata.ts
// Contains server functions pertaining to hearing data actions

import { sql } from '@vercel/postgres';
import { validateFrequencies } from '$lib/utility';

export async function checkYearAvailability(request: Request) {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const year = parseInt(formData.get('year') as string, 10);

    try {
        // Fetch employee_id for the selected user //this will be gone when merged so ignore this
        const yearsAvailabilityQuery = await sql`SELECT employee_id FROM Has WHERE employee_id = ${id} AND year=${year};`;
        if (yearsAvailabilityQuery.rows.length > 0) {
            throw new Error("This year's data has already been set!");
        }
    }
    catch (error: any) {
        const errorMessage = "Error determining if the employee has exising data for this year: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
    return JSON.stringify({
        success: true,
    });
}

export async function addHearingData(request: Request) {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const year = parseInt(formData.get('year') as string, 10);
    const leftEarFrequencies = JSON.parse(formData.get('leftEarFrequencies') as string);
    const rightEarFrequencies = JSON.parse(formData.get('rightEarFrequencies') as string);
    
    if (!validateFrequencies(leftEarFrequencies) || !validateFrequencies(rightEarFrequencies)) {
        throw new Error('Invalid frequency data');
    }

    try {
        // Fetch employee_id for the selected user //this will be gone when merged so ignore this
        const userIdQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${id};`;
        if (userIdQuery.rows.length === 0) {
            throw new Error("User not found");
        }

        // Fetch employee details
        const employeeQuery = await sql`
            SELECT last_active FROM employee 
            WHERE employee_id = ${id};
        `;
        if (employeeQuery.rows.length === 0) {
            throw new Error("User not found");
        }

        const lastActive = employeeQuery.rows[0].last_active; // Can be NULL if still active
        const currentYear = new Date().getFullYear();

        // **Validation 1: Ensure the year is within employment period**
        if (lastActive === null) {
            // Employee is still active
            if (year > currentYear || year < 1957) {
                throw new Error("Cannot add hearing data for invalid year range.");
            }
        } else {
            // Employee is inactive
            const lastActiveYear = new Date(lastActive).getFullYear();
            if (year > lastActiveYear || year < 1957) {
                throw new Error(`Cannot add hearing data after employment ended in ${lastActiveYear}.`);
            }
        }

        // **Validation 2: Ensure only one set of hearing data per year**
        const existingDataCheck = await sql`
            SELECT 1 FROM Has 
            WHERE employee_id = ${id} AND year = ${year}
            LIMIT 1;
        `;

        if (existingDataCheck.rows.length > 0) {
            throw new Error(`Hearing data for the year ${year} already exists for this employee.`);
        }

        // **Transform frequencies for insertion**
        const transformFrequencies = (frequencies: Record<string, string | number>) => {
            return Object.fromEntries(
                Object.entries(frequencies).map(([key, value]) => [
                    key,
                    value === "CNT" || value === null ? null : parseInt(value as string, 10),
                ])
            );
        };

        const leftEarFrequenciesTransformed = transformFrequencies(leftEarFrequencies);
        const rightEarFrequenciesTransformed = transformFrequencies(rightEarFrequencies);  
        
        console.log("Left Ear Transformed:", leftEarFrequenciesTransformed);
        console.log("Right Ear Transformed:", rightEarFrequenciesTransformed);

        // Insert left ear data into Data table
        const leftEarDataResult = await sql`
            INSERT INTO Data (Hz_500, Hz_1000, Hz_2000, Hz_3000, Hz_4000, Hz_6000, Hz_8000)
            VALUES (${leftEarFrequenciesTransformed.hz500}, ${leftEarFrequenciesTransformed.hz1000}, 
                    ${leftEarFrequenciesTransformed.hz2000}, ${leftEarFrequenciesTransformed.hz3000}, 
                    ${leftEarFrequenciesTransformed.hz4000}, ${leftEarFrequenciesTransformed.hz6000}, 
                    ${leftEarFrequenciesTransformed.hz8000})
            RETURNING data_id;
        `;

        const leftEarDataId = leftEarDataResult.rows[0].data_id;

        // Insert right ear data into Data table
        const rightEarDataResult = await sql`
            INSERT INTO Data (Hz_500, Hz_1000, Hz_2000, Hz_3000, Hz_4000, Hz_6000, Hz_8000)
            VALUES (${rightEarFrequenciesTransformed.hz500}, ${rightEarFrequenciesTransformed.hz1000}, 
                    ${rightEarFrequenciesTransformed.hz2000}, ${rightEarFrequenciesTransformed.hz3000}, 
                    ${rightEarFrequenciesTransformed.hz4000}, ${rightEarFrequenciesTransformed.hz6000}, 
                    ${rightEarFrequenciesTransformed.hz8000})
            RETURNING data_id;
        `;

        const rightEarDataId = rightEarDataResult.rows[0].data_id;

        //console.log(`Inserting into Has for Employee ID: ${employeeId}, Year: ${year}, Left Ear Data ID: ${leftEarDataId}, Right Ear Data ID: ${rightEarDataId}`);

        // Insert into Has table for right ear
        await sql`
            INSERT INTO Has (employee_id, data_id, year, ear)
            VALUES (${id}, ${rightEarDataId}, ${year}, 'right');
        `;

        // Insert into Has table for left ear
        await sql`
            INSERT INTO Has (employee_id, data_id, year, ear)
            VALUES (${id}, ${leftEarDataId}, ${year}, 'left');
        `;
    } 
    catch (error: any) {
        const errorMessage = "Unable to add employee hearing data: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
    return JSON.stringify({
        success: true,
    });
}

export async function modifyHearingData(request: Request) {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const year = parseInt(formData.get('year') as string, 10);
    const leftEarFrequencies = JSON.parse(formData.get('leftEarFrequencies') as string);
    const rightEarFrequencies = JSON.parse(formData.get('rightEarFrequencies') as string);
    
    if (!validateFrequencies(leftEarFrequencies) || !validateFrequencies(rightEarFrequencies)) {
        throw new Error('Invalid frequency data');
    }

    try {
        // Check if hearing data exists for this employee, year, and ear
        const existingLeftData = await sql`
            SELECT d.data_id FROM Data d
            JOIN Has h ON d.data_id = h.data_id
            WHERE h.employee_id = ${id} AND h.year = ${year} AND h.ear = 'left';
        `;

        const existingRightData = await sql`
            SELECT d.data_id FROM Data d
            JOIN Has h ON d.data_id = h.data_id
            WHERE h.employee_id = ${id} AND h.year = ${year} AND h.ear = 'right';
        `;

        const transformFrequencies = (frequencies: Record<string, string | number>) => {
            return Object.fromEntries(
                Object.entries(frequencies).map(([key, value]) => [
                    key,
                    value === "CNT" || value === null ? null : parseInt(value as string, 10),
                ])
            );
        };

        const leftEarFrequenciesTransformed = transformFrequencies(leftEarFrequencies);
        const rightEarFrequenciesTransformed = transformFrequencies(rightEarFrequencies);      

        if (existingLeftData.rows.length > 0) {
            // Update left ear data
            const leftDataId = existingLeftData.rows[0].data_id;
            await sql`
                UPDATE Data
                SET Hz_500 = ${leftEarFrequenciesTransformed.hz500}, Hz_1000 = ${leftEarFrequenciesTransformed.hz1000}, 
                    Hz_2000 = ${leftEarFrequenciesTransformed.hz2000}, Hz_3000 = ${leftEarFrequenciesTransformed.hz3000}, 
                    Hz_4000 = ${leftEarFrequenciesTransformed.hz4000}, Hz_6000 = ${leftEarFrequenciesTransformed.hz6000}, 
                    Hz_8000 = ${leftEarFrequenciesTransformed.hz8000}
                WHERE data_id = ${leftDataId};
            `;
        } else {
            // Insert new left ear data
            const leftEarDataResult = await sql`
                INSERT INTO Data (Hz_500, Hz_1000, Hz_2000, Hz_3000, Hz_4000, Hz_6000, Hz_8000)
                VALUES (${leftEarFrequenciesTransformed.hz500}, ${leftEarFrequenciesTransformed.hz1000}, ${leftEarFrequenciesTransformed.hz2000}, 
                        ${leftEarFrequenciesTransformed.hz3000}, ${leftEarFrequenciesTransformed.hz4000}, ${leftEarFrequenciesTransformed.hz6000}, ${leftEarFrequenciesTransformed.hz8000})
                RETURNING data_id;
            `;
            const leftEarDataId = leftEarDataResult.rows[0].data_id;

            // Insert into Has table
            await sql`
                INSERT INTO Has (employee_id, data_id, year, ear)
                VALUES (${id}, ${leftEarDataId}, ${year}, 'left');
            `;
        }

        if (existingRightData.rows.length > 0) {
            // Update right ear data
            const rightDataId = existingRightData.rows[0].data_id;
            await sql`
                UPDATE Data
                SET Hz_500 = ${rightEarFrequenciesTransformed.hz500}, Hz_1000 = ${rightEarFrequenciesTransformed.hz1000}, 
                    Hz_2000 = ${rightEarFrequenciesTransformed.hz2000}, Hz_3000 = ${rightEarFrequenciesTransformed.hz3000}, 
                    Hz_4000 = ${rightEarFrequenciesTransformed.hz4000}, Hz_6000 = ${rightEarFrequenciesTransformed.hz6000}, 
                    Hz_8000 = ${rightEarFrequenciesTransformed.hz8000}
                WHERE data_id = ${rightDataId};
            `;
        } else {
            // Insert new right ear data
            const rightEarDataResult = await sql`
                INSERT INTO Data (Hz_500, Hz_1000, Hz_2000, Hz_3000, Hz_4000, Hz_6000, Hz_8000)
                VALUES (${rightEarFrequenciesTransformed.hz500}, ${rightEarFrequenciesTransformed.hz1000}, ${rightEarFrequenciesTransformed.hz2000}, 
                        ${rightEarFrequenciesTransformed.hz3000}, ${rightEarFrequenciesTransformed.hz4000}, ${rightEarFrequenciesTransformed.hz6000}, ${rightEarFrequenciesTransformed.hz8000})
                RETURNING data_id;
            `;
            const rightEarDataId = rightEarDataResult.rows[0].data_id;

            // Insert into Has table
            await sql`
                INSERT INTO Has (employee_id, data_id, year, ear)
                VALUES (${id}, ${rightEarDataId}, ${year}, 'right');
            `;
        }

    } catch (error: any) {
        const errorMessage = "Unable to modify employee hearing data: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }

    return JSON.stringify({
        success: true,
    });
}

/**
 * @deprecated use extractEmployeeHearingHistory instead
 */
export async function fetchCalculateSTSData(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const year = parseInt(formData.get('year') as string, 10);

    try {
        // Fetch raw hearing data for the employee
        const dataQuery = await sql`
            SELECT d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, d.Hz_4000, d.Hz_6000, d.Hz_8000, 
                   h.ear, h.year, e.date_of_birth, e.sex
            FROM Has h
            JOIN Data d ON h.data_id = d.data_id
            JOIN Employee e ON h.employee_id = e.employee_id
            WHERE h.employee_id = ${employeeID}
            ORDER BY h.year ASC;
        `;

        if (dataQuery.rows.length === 0) {
            throw new Error("Hearing data not found");
        }

        // Prepare data for client-side processing
        const hearingData = {
            employeeID,
            dateOfBirth: dataQuery.rows[0].date_of_birth,
            sex: dataQuery.rows[0].sex,
            screenings: dataQuery.rows.reduce((acc, row) => {
                const yearKey = row.year;
                if (!acc[yearKey]) {
                    acc[yearKey] = { left: {}, right: {} };
                }

                const frequencies = {
                    hz500: row.hz_500,
                    hz1000: row.hz_1000,
                    hz2000: row.hz_2000,
                    hz3000: row.hz_3000,
                    hz4000: row.hz_4000,
                    hz6000: row.hz_6000,
                    hz8000: row.hz_8000
                };

                if (row.ear.trim().toLowerCase() === 'left') {
                    acc[yearKey].left = frequencies;
                } else if (row.ear.trim().toLowerCase() === 'right') {
                    acc[yearKey].right = frequencies;
                }

                return acc;
            }, {})
        };

        return JSON.stringify({
            success: true, 
            hearingData
        });
    }
    catch (error: any) {
        const errorMessage = "Failed to fetch hearing data: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
}