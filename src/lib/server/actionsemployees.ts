// actionsemployees.ts
// Contains server functions pertaining to employee actions

import { sql } from '@vercel/postgres';
import { error } from '@sveltejs/kit';
import { type HearingScreening } from "$lib/interpret";
import { DatabaseError, type EmployeeInfo, type HearingHistory } from '$lib/MyTypes';
import { checkEmployeeExists, checkEmployeeHearingScreeningFromDatabase, extractEmployeeHearingHistoryFromDatabase, extractEmployeeHearingScreeningFromDatabase, extractEmployeeHearingScreeningsFromDatabase, extractEmployeeInfoFromDatabase, extractEmployeeInfosFromDatabase } from './databasefunctions';

export async function extractEmployeeInfo(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;

    try {
        await checkEmployeeExists(employeeID); // will throw error if employee is not found
        const employeeInfo: EmployeeInfo = await extractEmployeeInfoFromDatabase(employeeID);

        // Return only the necessary data in a plain object format
        return JSON.stringify(employeeInfo);
    } 
    catch (e: any) {
        const errorMessage = "Failed to fetch employee info: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }
}

export async function extractEmployeeInfos(request: Request) {
    try {
        const employeeInfos: EmployeeInfo[] = await extractEmployeeInfosFromDatabase();

        // Return only the necessary data in a plain object format
        return JSON.stringify(employeeInfos);
    } 
    catch (e: any) {
        const errorMessage = "Failed to fetch employee info: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
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
        if (employeeIDQuery.rows.length === 0) throw new DatabaseError("Employee with given ID does not exist in database.");

        const resultFirst = await sql`UPDATE Employee SET first_name = ${newFirstName} WHERE employee_id=${employeeID};`
        const resultLast = await sql`UPDATE Employee SET last_name = ${newLastName} WHERE employee_id=${employeeID};`
        
        if (resultFirst.rowCount === 0) throw new DatabaseError("First name was not updated. Employee ID might be incorrect");
        if (resultLast.rowCount === 0) throw new DatabaseError("Last name was not updated. Employee ID might be incorrect");

    } catch (e: any) {
        const errorMessage = "Failed to update employee name: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }
}

export async function modifyEmployeeEmail(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const newEmail = formData.get('newEmail') as string;

    try {
        // Check if employee exists in database
        const employeeIDQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeIDQuery.rows.length === 0) throw new DatabaseError("Employee with given ID does not exist in database.");

        const result = await sql`UPDATE Employee SET email = ${newEmail} WHERE employee_id=${employeeID};`
        
        if (result.rowCount === 0) throw new DatabaseError("Email was not updated. Employee ID might be incorrect");
    }
    catch (e: any) {
        const errorMessage = "Failed to update employee email: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }
}

export async function modifyEmployeeDOB(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const newDOB = formData.get('newDOB') as string;

    try {
        // Check if employee exists in database
        const employeeIDQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeIDQuery.rows.length === 0) throw new DatabaseError("Employee with given ID does not exist in database.");

        const result = await sql`UPDATE Employee SET date_of_birth = ${newDOB} WHERE employee_id=${employeeID};`
        
        if (result.rowCount === 0) throw new DatabaseError("DOB was not updated. Employee ID might be incorrect");
    } catch (e: any) {
        const errorMessage = "Error modifying employee date of birth: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }
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
        if (employeeIDQuery.rows.length === 0) throw new DatabaseError("Employee with given ID does not exist in database.");

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
    catch (e: any) {
        const errorMessage = "Failed to update employment status: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }
}

export async function modifyEmployeeSex(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const newSex = formData.get('newSex') as string;

    console.log(`EmployeeID: ${employeeID}, sex: ${newSex}`);

    try {
        // Check if employee exists in database
        const employeeIDQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeIDQuery.rows.length === 0) throw new DatabaseError("Employee with given ID does not exist in database.");
        await sql`
            UPDATE Employee 
            SET sex = ${newSex}
            WHERE employee_id = ${employeeID};
        `;
    } 
    catch (e: any) {
        const errorMessage = "Failed to update employee's sex: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
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

        return JSON.stringify(screening);
    } 
    catch (e: any) {
        const errorMessage = "Error in database when extracting employee hearing screening: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }
}

// Returns a boolean of if a hearing screening exists for the provided form data.
export async function checkEmployeeHearingScreening(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const year = formData.get('year') as string;
    
    try {
        await checkEmployeeExists(employeeID); // will throw error if employee is not found
        // Get employee hearing screenings from database
        const exists: boolean = await checkEmployeeHearingScreeningFromDatabase(employeeID, year);

        return JSON.stringify(exists);
    } 
    catch (e: any) {
        const errorMessage = "Error in database when extracting employee hearing screening: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }
}

export async function extractEmployeeHearingScreenings(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    
    try {
        await checkEmployeeExists(employeeID); // will throw error if employee is not found
        // Get employee hearing screenings from database
        const screenings: HearingScreening[] = await extractEmployeeHearingScreeningsFromDatabase(employeeID);

        return JSON.stringify(screenings);
    } 
    catch (e: any) {
        const errorMessage = "Error in database when extracting employee hearing screenings: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }
}

export async function extractEmployeeHearingHistory(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    
    try {
        const employeeInfo: EmployeeInfo = await extractEmployeeInfoFromDatabase(employeeID);
        // Get employee hearing screenings from database
        const history: HearingHistory = await extractEmployeeHearingHistoryFromDatabase(employeeInfo);

        return JSON.stringify(history);
    } 
    catch (e: any) {
        const errorMessage = "Error in database when extracting employee hearing history: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
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
                if (!employeeInfo.lastActive && omitInactive) return null;  // Skip this iteration

                // Get employee hearing screenings from database
                let history: HearingHistory | null;
                try {
                    history = await extractEmployeeHearingHistoryFromDatabase(employeeInfo);
                }
                catch (e: any) {
                    console.log(`Could not fetch hearing history for ${employeeInfo.id}: ${employeeInfo.firstName}. This is fine if the employee does not have any audiograms recorded.`)
                    history = null;
                }
                return history;
            })
        );

        // Filter out null entries
        const histories: HearingHistory[] = rawHistories.filter((history) => history !== null);

        return JSON.stringify(histories);
    } 
    catch (e: any) {
        const errorMessage = "Error in database when extracting employee hearing histories: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage, e.stack);
        error(404, { message: errorMessage });
    }
}