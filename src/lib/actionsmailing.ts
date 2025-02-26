import { sql } from '@vercel/postgres';

// interface Request {
//     formData: () => Promise<FormData>;
// }

// TODO: Refactor to use Employee from MyTypes.ts instead
interface EmployeeData {
    employeeID: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
}

// TODO: Refactor to use HearingData from MyTypes.ts instead
interface HearingData {
    year: number;
    ear: string;
    hz500: number | null;
    hz1000: number | null;
    hz2000: number | null;
    hz3000: number | null;
    hz4000: number | null;
    hz6000: number | null;
    hz8000: number | null;
}

export async function extractBaselineHearingData(request: Request) {
    try {
        const formData = await request.formData();
        const employeeIDs = formData.get('employeeIDs') as string;
        const parsedEmployeeIDs = JSON.parse(employeeIDs);

        let baselineHearingData: HearingData[] = [];

        for (const singleID of parsedEmployeeIDs) {
            // Verify the employee exists
            const employeeCheck = await sql`
                SELECT employee_id FROM Employee WHERE employee_id = ${singleID};
            `;

            if (employeeCheck.rows.length === 0) {
                throw new Error(`Employee ${singleID} not found`);
            }

            // Fetch baseline (earliest) hearing data for the employee
            const baselineDataQuery = await sql`
                WITH earliest_year AS (
                    SELECT MIN(h.year) as min_year
                    FROM Has h
                    WHERE h.employee_id = ${singleID}
                )
                SELECT h.year, h.ear, 
                    d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, 
                    d.Hz_4000, d.Hz_6000, d.Hz_8000
                FROM Has h
                JOIN Data d ON h.data_id = d.data_id
                JOIN earliest_year ey ON h.year = ey.min_year
                WHERE h.employee_id = ${singleID}
                ORDER BY h.ear;
            `;

            const hearingData: HearingData[] = baselineDataQuery.rows.map(row => ({
                id: singleID,
                year: row.year,
                ear: row.ear,
                hz500: row.hz_500,
                hz1000: row.hz_1000,
                hz2000: row.hz_2000,
                hz3000: row.hz_3000,
                hz4000: row.hz_4000,
                hz6000: row.hz_6000,
                hz8000: row.hz_8000
            }));

            baselineHearingData = baselineHearingData.concat(hearingData);
        }

        return JSON.stringify({
            success: true,
            baselineHearingData
        });
    } catch (error: any) {
        const errorMessage = "Failed to extract baseline hearing data: " + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
}

export async function extractRecentHearingData(request: Request) {
    try {
        const formData = await request.formData();
        const employeeIDs = formData.get('employeeIDs') as string;
        const parsedEmployeeIDs = JSON.parse(employeeIDs);

        let recentHearingData: HearingData[] = [];

        for (const singleID of parsedEmployeeIDs) {
            // Verify the employee exists
            const employeeCheck = await sql`
                SELECT employee_id FROM Employee WHERE employee_id = ${singleID};
            `;

            if (employeeCheck.rows.length === 0) {
                throw new Error(`Employee ${singleID} not found`);
            }

            // Fetch most recent hearing data for the employee
            const recentDataQuery = await sql`
                WITH latest_year AS (
                    SELECT MAX(h.year) as max_year
                    FROM Has h
                    WHERE h.employee_id = ${singleID}
                )
                SELECT h.year, h.ear, 
                    d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, 
                    d.Hz_4000, d.Hz_6000, d.Hz_8000
                FROM Has h
                JOIN Data d ON h.data_id = d.data_id
                JOIN latest_year ly ON h.year = ly.max_year
                WHERE h.employee_id = ${singleID}
                ORDER BY h.ear;
            `;

            const hearingData: HearingData[] = recentDataQuery.rows.map(row => ({
                id: singleID,
                year: row.year,
                ear: row.ear,
                hz500: row.hz_500,
                hz1000: row.hz_1000,
                hz2000: row.hz_2000,
                hz3000: row.hz_3000,
                hz4000: row.hz_4000,
                hz6000: row.hz_6000,
                hz8000: row.hz_8000
            }));

            recentHearingData = recentHearingData.concat(hearingData);
        }

        return JSON.stringify({
            success: true,
            recentHearingData
        });
    } catch (error: any) {
        const errorMessage = "Failed to extract recent hearing data: " + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
}

export async function extractAllEmployeeData(request: Request) {
    try {
        // You can process request if needed
        await request.formData();

        const employeesQuery = await sql`
            SELECT employee_id, first_name, last_name, email, date_of_birth, sex
            FROM Employee
            ORDER BY last_name, first_name;
        `;

        const employees: EmployeeData[] = employeesQuery.rows.map(row => ({
            employeeID: row.employee_id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            dateOfBirth: row.date_of_birth
        }));

        return JSON.stringify({ 
            success: true, 
            employees 
        });
    } catch (error: any) {
        const errorMessage = "Failed to extract employee data: " + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
}

export async function extractHearingData(request: Request) {
    try {
        const formData = await request.formData();
        const employeeIDs = formData.get('employeeIDs') as string;
        const parsedEmployeeIDs = JSON.parse(employeeIDs);

        let allHearingData: HearingData[] = [];

        for (const singleID of parsedEmployeeIDs) {
            // Verify the employee exists
            const employeeCheck = await sql`
                SELECT employee_id FROM Employee WHERE employee_id = ${singleID};
            `;

            if (employeeCheck.rows.length === 0) {
                throw new Error("Employee not found");
            }

            // Fetch all hearing data for the employee
            const hearingDataQuery = await sql`
                SELECT h.year, h.ear, 
                    d.Hz_500, d.Hz_1000, d.Hz_2000, d.Hz_3000, 
                    d.Hz_4000, d.Hz_6000, d.Hz_8000
                FROM Has h
                JOIN Data d ON h.data_id = d.data_id
                WHERE h.employee_id = ${singleID}
                ORDER BY h.year, h.ear;
            `;

            const hearingData: HearingData[] = hearingDataQuery.rows.map(row => ({
                id: singleID,
                year: row.year,
                ear: row.ear,
                hz500: row.hz_500,
                hz1000: row.hz_1000,
                hz2000: row.hz_2000,
                hz3000: row.hz_3000,
                hz4000: row.hz_4000,
                hz6000: row.hz_6000,
                hz8000: row.hz_8000
            }));

            allHearingData = allHearingData.concat(hearingData); // Accumulate data for all employees
        }

        return JSON.stringify({
            success: true,
            hearingData: allHearingData
        });
    } catch (error: any) {
        const errorMessage = "Failed to extract hearing data: " + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
}