// actionsemployees.ts
// Contains server functions pertaining to employee actions

import { sql } from '@vercel/postgres';
import { UserHearingScreeningHistory, HearingScreening, HearingDataOneEar, PersonSex } from "./interpret";
import { getHearingDataFromDatabaseRow } from './utility';
import type { HearingDataSingle } from './MyTypes';

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
            const errorMessage = "Hearing data not found"
            
        }
        //console.log("query: ", JSON.stringify(dataQuery));

        // create an empty object to store hearing data grouped by year
        const hearingDataByYear: Record<number, { leftEar: number[], rightEar: number[] }> = {};

        dataQuery.rows.forEach(row => { // Loop through each row of the query result to group data by year and store frequency thresholds for each ear separately
            const yearKey = Number(row.year);
            const earSide = row.ear.trim().toLowerCase();  // Normalize ear value
        
            if (!hearingDataByYear[yearKey]) {
                hearingDataByYear[yearKey] = { leftEar: new Array(7).fill(0), rightEar: new Array(7).fill(0) };
            }
        
            const frequencies = [
                Number(row.hz_500) ?? 0, 
                Number(row.hz_1000) ?? 0, 
                Number(row.hz_2000) ?? 0, 
                Number(row.hz_3000) ?? 0, 
                Number(row.hz_4000) ?? 0, 
                Number(row.hz_6000) ?? 0, 
                Number(row.hz_8000) ?? 0
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
    
        //console.log("SCREENINGS: ", screenings);
        
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

       console.log("REPORT: ", hearingReport);

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