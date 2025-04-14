// actionsemployees.ts
// Contains server functions pertaining to employee actions

import { sql } from '@vercel/postgres';
import { UserHearingScreeningHistory, type HearingScreening, type HearingDataOneEar, PersonSex } from "$lib/interpret";
import type { EmployeeInfo, HearingHistory } from '$lib/MyTypes';
import { checkEmployeeExists, extractEmployeeHearingHistoryFromDatabase, extractEmployeeHearingScreeningFromDatabase, extractEmployeeHearingScreeningsFromDatabase, extractEmployeeInfoFromDatabase, extractEmployeeInfosFromDatabase } from './databasefunctions';

export async function extractEmployeeInfo(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;

    try {
        await checkEmployeeExists(employeeID); // will throw error if employee is not found
        const employeeInfo: EmployeeInfo = await extractEmployeeInfoFromDatabase(employeeID);

        // Return only the necessary data in a plain object format
        return JSON.stringify({
            success: true,
            employeeInfo
        });
    } 
    catch (error: any) {
        const errorMessage = "Failed to fetch employee info: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }
}

export async function extractEmployeeInfos(request: Request) {
    const formData = await request.formData();

    try {
        const employeeInfos: EmployeeInfo[] = await extractEmployeeInfosFromDatabase();

        // Return only the necessary data in a plain object format
        return JSON.stringify({
            success: true,
            employeeInfos
        });
    } 
    catch (error: any) {
        const errorMessage = "Failed to fetch employee info: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }
}

export async function modifyEmployeeName(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const newFirstName = formData.get('newFirstName') as string;
    const newLastName = formData.get('newLastName') as string;

    try {
        // Check if employee exists in database
        const employeeIDQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeIDQuery.rows.length === 0) {
            throw new Error("User not found");
        }

        const resultFirst = await sql`UPDATE Employee SET first_name = ${newFirstName} WHERE employee_id=${employeeID};`
        const resultLast = await sql`UPDATE Employee SET last_name = ${newLastName} WHERE employee_id=${employeeID};`
        
        if (resultFirst.rowCount === 0) {
            return { success: false, message: 'First name was not updated. Employee ID might be incorrect.' };
        }
        if (resultLast.rowCount === 0) {
            return { success: false, message: 'Last name was not updated. Employee ID might be incorrect.' };
        }

    } catch (error: any) {
        const errorMessage = "Failed to update employee name: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }

    return JSON.stringify({
        success: true,
    });
}

export async function modifyEmployeeEmail(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const newEmail = formData.get('newEmail') as string;

    try {
        // Check if employee exists in database
        const employeeIDQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeIDQuery.rows.length === 0) {
            throw new Error("User not found");
        }

        const result = await sql`UPDATE Employee SET email = ${newEmail} WHERE employee_id=${employeeID};`
        
        if (result.rowCount === 0) {
            return { success: false, message: 'Email was not updated. Employee ID might be incorrect.' };
        }
    } catch (error: any) {
        const errorMessage = "Failed to update employee email: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }

    return JSON.stringify({
        success: true,
    });
}

export async function modifyEmployeeDOB(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const newDOB = formData.get('newDOB') as string;

    try {
        // Check if employee exists in database
        const employeeIDQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeIDQuery.rows.length === 0) {
            throw new Error("User not found");
        }

        const result = await sql`UPDATE Employee SET date_of_birth = ${newDOB} WHERE employee_id=${employeeID};`
        
        if (result.rowCount === 0) {
            return { success: false, message: 'DOB was not updated. Employee ID might be incorrect.' };
        }
    } catch (error: any) {
        const errorMessage = "Error modifying employee date of birth: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }

    return JSON.stringify({
        success: true,
    });
}

export async function modifyEmployeeStatus(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const newActiveStatus = formData.get('newActiveStatus') as string;

    const lastActiveValue = newActiveStatus === "" ? null : newActiveStatus;
    console.log(`EmployeeID: ${employeeID}, status: ${lastActiveValue}`);

    try {
        // Check if employee exists in database
        const employeeIDQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeIDQuery.rows.length === 0) {
            throw new Error("User not found");
        }

        if (lastActiveValue !== null) {
            await sql`
                UPDATE Employee 
                SET last_active = ${lastActiveValue}
                WHERE employee_id = ${employeeID};
            `;
        } else {
            await sql`
                UPDATE Employee 
                SET last_active = NULL
                WHERE employee_id = ${employeeID};
            `;
        }
    } 
    catch (error: any) {
        const errorMessage = "Failed to update employment status: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }

    return JSON.stringify({
        success: true,
    });
}

export async function modifyEmployeeSex(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const newSex = formData.get('newSex') as string;

    console.log(`EmployeeID: ${employeeID}, sex: ${newSex}`);

    try {
        // Check if employee exists in database
        const employeeIDQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeIDQuery.rows.length === 0) {
            throw new Error("User not found");
        }
            await sql`
                UPDATE Employee 
                SET sex = ${newSex}
                WHERE employee_id = ${employeeID};
            `;
    } 
    catch (error: any) {
        const errorMessage = "Failed to update employee's sex: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }

    return JSON.stringify({
        success: true,
    });
}

/**
 * 
 * @param request The POST request.
 * @deprecated no longer calculating STS on server.
 * use extractEmployeeHearingScreenings() or extractEmployeeHearingHistory() instead
 * @returns STS Calculated Hearing Report.
 */
export async function calculateSTS(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const year = parseInt(formData.get('year') as string, 10);
    const sex = formData.get('sex') as string;

    //console.log("ID: ", employeeID, "YEAR: ", year, "SEX: ", sex);

    try { 
        // get dob from database 
        const employeeQuery = await sql`SELECT date_of_birth FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeQuery.rows.length === 0) {
            throw new Error("User not found");
            const errorMessage = "User not found"
        }
        const employee = employeeQuery.rows[0];
        const dob = employee.date_of_birth;
        
        // age calculation for the selected year
        const yearDate = new Date(year, 0 , 1); // January 1st of the given year // may need to track entire date in database?
        const dobDate = new Date(dob);
        let age = yearDate.getFullYear() - dobDate.getFullYear();
        
        if ( // Check if the birthday has occurred this year
            yearDate.getMonth() < dobDate.getMonth() || 
            (yearDate.getMonth() === dobDate.getMonth() && yearDate.getDate() < dobDate.getDate())
        ) {
            age--;
        }
        // get all frequencies, ear, and year
        const dataQuery = await sql`
            SELECT d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, d.Hz_4000, d.Hz_6000, d.Hz_8000, h.ear, h.year
            FROM Has h
            JOIN Data d ON h.data_id = d.data_id
            WHERE h.employee_id = ${employeeID}
            ORDER BY h.year ASC;
        `;

        if (dataQuery.rows.length === 0) {
            throw new Error("Hearing data not found");
        }
        //console.log("query: ", JSON.stringify(dataQuery));

        // create an empty object to store hearing data grouped by year
        const hearingDataByYear: Record<number, { leftEar: (number | null)[], rightEar: (number | null)[] }> = {};

        dataQuery.rows.forEach(row => { // Loop through each row of the query result to group data by year and store frequency thresholds for each ear separately
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
            
            //console.log(`Frequencies for ${earSide} ear in ${yearKey}:`, frequencies);
        
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
    
        console.log("SCREENINGS: ", screenings);
        
        // Convert sex string to enum
        const personSex = sex === "Male" ? PersonSex.Male : sex === "Female" ? PersonSex.Female : PersonSex.Other;

        // Create UserHearingScreeningHistory instance
        const userHearingHistory = new UserHearingScreeningHistory(age, personSex, year, screenings);
        // Generate hearing report
        const hearingReport = userHearingHistory.GenerateHearingReport();
        if (hearingReport.length === 0) {
            const errorMessage = "Hearing report not generated.";
            throw new Error(errorMessage);
        }

    //    console.log("REPORT: ", hearingReport);

        return JSON.stringify({
            success: true, 
            hearingReport
        });
    }
    catch (error: any) {
        const errorMessage = "Failed to calculate STS status: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
}

export async function extractEmployeeHearingScreening(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const year = formData.get('year') as string;
    
    try {
        await checkEmployeeExists(employeeID); // will throw error if employee is not found
        // Get employee hearing screenings from database
        const screening: HearingScreening = await extractEmployeeHearingScreeningFromDatabase(employeeID, year);

        return JSON.stringify({
            success: true,
            screening
        });
    } 
    catch (error: any) {
        const errorMessage = "Error in database when extracting employee hearing screenings: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
}

export async function extractEmployeeHearingScreenings(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    
    try {
        await checkEmployeeExists(employeeID); // will throw error if employee is not found
        // Get employee hearing screenings from database
        const screenings: HearingScreening[] = await extractEmployeeHearingScreeningsFromDatabase(employeeID);

        return JSON.stringify({
            success: true,
            screenings
        });
    } 
    catch (error: any) {
        const errorMessage = "Error in database when extracting employee hearing screenings: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
}

export async function extractEmployeeHearingHistory(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    
    try {
        const employeeInfo: EmployeeInfo = await extractEmployeeInfoFromDatabase(employeeID);
        // Get employee hearing screenings from database
        const history: HearingHistory = await extractEmployeeHearingHistoryFromDatabase(employeeInfo);

        return JSON.stringify({
            success: true,
            history
        });
    } 
    catch (error: any) {
        const errorMessage = "Error in database when extracting employee hearing history: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
}

export async function extractAllEmployeeHearingHistories(request: Request) {
    const formData = await request.formData();
    const omitInactive: boolean = formData.get('omitInactive') === 'true';

    try {
        // Goal: Iterate through employees and individually get their hearing history
        // TODO: While this works, it uses a lot of database queries. Create a DB function that can get multiple emp. histories in one query.

        const employeeInfos: EmployeeInfo[] = await extractEmployeeInfosFromDatabase();
        
        const rawHistories: (HearingHistory | null)[] = await Promise.all(
            employeeInfos.map(async (employeeInfo) => {
                // Skip inactive employees if omitInactive is true
                if (employeeInfo.lastActive && omitInactive) return null;  // Skip this iteration

                // Get employee hearing screenings from database
                let history: HearingHistory | null;
                try {
                    history = await extractEmployeeHearingHistoryFromDatabase(employeeInfo);
                }
                catch (error: any) {
                    console.log(`Could not fetch hearing history for ${employeeInfo.id}: ${employeeInfo.firstName}. This is fine if the employee does not have any audiograms recorded.`)
                    history = null;
                }
                return history;
            })
        );

        // Filter out null entries
        const histories: HearingHistory[] = rawHistories.filter((history) => history !== null);

        return JSON.stringify({
            success: true,
            histories
        });
    } 
    catch (error: any) {
        const errorMessage = "Error in database when extracting employee hearing histories: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage, error.stack);
        return JSON.stringify({ success: false, message: errorMessage });
    }
}