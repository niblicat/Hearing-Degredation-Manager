// actionsemployees.ts
// Contains server functions pertaining to employee actions

import { sql } from '@vercel/postgres';
import { UserHearingScreeningHistory, HearingScreening, HearingDataOneEar, PersonSex } from "$lib/interpret";
import { getHearingDataFromDatabaseRow } from '$lib/utility';
import type { HearingDataSingle } from '$lib/MyTypes';

export async function fetchYears(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;

    try {
        // Check if employee exists in database
        const employeeIDQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeIDQuery.rows.length === 0) {
            throw new Error("User not found");
        }

        const yearsQuery = await sql`
            SELECT DISTINCT year
            FROM Has
            WHERE employee_id = ${employeeID}
            ORDER BY year;
        `;

        const availableYears = yearsQuery.rows.map(row => row.year);
        
        const yearsReturn = {
            success: true,
            years: availableYears
        }

        return JSON.stringify(yearsReturn);
    } 
    catch (error: any) {
        const errorMessage = "Failed to fetch employee years of employment: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }
}

export async function fetchEmployeeInfo(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;

    try {
        // Check if employee exists in database
        const employeeIDQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeIDQuery.rows.length === 0) {
            throw new Error("User not found");
        }

        // Query employee data
        const employeeQuery = await sql`
            SELECT email, date_of_birth, last_active, sex
            FROM Employee 
            WHERE employee_id = ${employeeID};
        `;

        if (employeeQuery.rowCount === 0) {
            return JSON.stringify({ success: false, message: 'Employee not found' });
        }

        const employee = employeeQuery.rows[0];
        const employmentStatus = employee.last_active ? 'Inactive' : 'Active';

       //console.log(`Employee email: ${employee.email}, Employment Status: ${employmentStatus}, Employee: ${employeeID}, DOB: ${employee.date_of_birth}, SEX: ${employee.sex}`);

        const employeeData = {
            email: employee.email,
            dob: employee.date_of_birth,
            employmentStatus,
            sex: employee.sex
        }

        const dataReturnTest = {
            success: true,
            employee: employeeData
        }

        //JSON.stringify(dataReturnTest));

        // Return only the necessary data in a plain object format
        return JSON.stringify({
            success: true,
            employee: employeeData
        });
    } 
    catch (error: any) {
        const errorMessage = "Failed to fetch employee data: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }
}

export async function fetchHearingData(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const year = formData.get('year') as string;

    try {
        // Check if employee exists in database
        const employeeIDQuery = await sql`SELECT employee_id FROM Employee WHERE employee_id = ${employeeID};`;
        if (employeeIDQuery.rows.length === 0) {
            throw new Error("User not found");
        }
        
        // Get the oldest available year for the employee
        const baselineYearQuery = await sql`
            SELECT MIN(year) AS baseline_year
            FROM Has
            WHERE employee_id = ${employeeID};
        `;
        const baselineYear = baselineYearQuery.rows[0]?.baseline_year;

        // Fetch hearing data for the baseline year
        const baselineDataQuery = await sql`
            SELECT d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, d.Hz_4000, d.Hz_6000, d.Hz_8000, h.ear
            FROM Has h
            JOIN Data d ON h.data_id = d.data_id
            WHERE h.employee_id = ${employeeID} AND h.year = ${baselineYear};
        `;

        // Fetch hearing data for the new year
        const newDataQuery = await sql`
            SELECT d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, d.Hz_4000, d.Hz_6000, d.Hz_8000, h.ear
            FROM Has h
            JOIN Data d ON h.data_id = d.data_id
            WHERE h.employee_id = ${employeeID} AND h.year = ${year};
        `;

        const baselineData = {
            rightEar: baselineDataQuery.rows.filter(row => row.ear === 'right')[0] ?? null,
            leftEar: baselineDataQuery.rows.filter(row => row.ear === 'left')[0] ?? null,
        };

        const newData = {
            rightEar: newDataQuery.rows.filter(row => row.ear === 'right')[0] ?? null,
            leftEar: newDataQuery.rows.filter(row => row.ear === 'left')[0] ?? null,
        };

        return JSON.stringify({
            success: true,
            hearingData: {
                baselineYear,
                newYear: year,
                baselineData,
                newData,
            },
        });
    }
    catch (error: any) {
        const errorMessage = "Could not fetch hearing data: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
}

export async function fetchHearingDataForYear(request: Request) {
    const formData = await request.formData();
    const employeeID = formData.get('employeeID') as string;
    const year = formData.get('year') as string;

    console.log(`EmployeeID: ${employeeID}, Year: ${year}`);

    try {
        // Fetch hearing data for the new year
        const hearingDataQuery = await sql`
            SELECT d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, d.Hz_4000, d.Hz_6000, d.Hz_8000, h.ear
            FROM Has h
            JOIN Data d ON h.data_id = d.data_id
            WHERE h.employee_id = ${employeeID} AND h.year = ${year};
        `;

        const earData = {
            rightEar: hearingDataQuery.rows.filter(row => row.ear === 'right')[0] ?? null,
            leftEar: hearingDataQuery.rows.filter(row => row.ear === 'left')[0] ?? null,
        };

        if (!earData.rightEar && !earData.leftEar) {
            const errorMessage = `There exists no hearing data for the year ${year}`;
            console.error(errorMessage);
            return JSON.stringify({ success: false, message: errorMessage });
        }

        const parsedLeftEar: HearingDataSingle = await getHearingDataFromDatabaseRow(earData.leftEar);
        const parsedRightEar: HearingDataSingle = await getHearingDataFromDatabaseRow(earData.rightEar);

        const dataReturn = {
            success: true,
            hearingData: {
                year: year,
                leftEar: parsedLeftEar,
                rightEar: parsedRightEar
            },
        }

        return JSON.stringify(dataReturn);
    }
    catch (error: any) {
        const errorMessage = "Could not fetch hearing data: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
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