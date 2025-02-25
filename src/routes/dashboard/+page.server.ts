import type { Actions, PageServerLoad } from './$types';
import { getAdminsFromDatabase, getEmployeesFromDatabase, turnAwayNonAdmins } from '$lib/utility';
import { addHearingData, checkYearAvailability, modifyHearingData } from '$lib/actionshearingdata';
import { fetchEmployeeInfo, fetchHearingData, fetchHearingDataForYear, fetchYears, modifyEmployeeDOB, modifyEmployeeEmail, modifyEmployeeName, modifyEmployeeStatus, calculateSTS } from '$lib/actionsemployees';
import { addEmployee } from '$lib/actionsemployeeadd';
import { deleteAdmins, modifyAdminName, modifyAdminPermissions } from '$lib/actionsadmins';

export const load: PageServerLoad = async ( event ) => {
    await turnAwayNonAdmins(event);

    // TODO: error handling
    const employees = await getEmployeesFromDatabase();
    const admins = await getAdminsFromDatabase();

    // console.log("Loaded employees:", employees); 

    return {
        employees: employees,
        admins: admins
    };
};

// Actions for login and registration
export const actions: Actions = {
    // actionsadmins.ts
    modifyAdminPermissions: async ({ request }) => {
        return modifyAdminPermissions(request);
    },
    modifyAdminName: async ({ request }) => {
        return modifyAdminName(request);
    },
    deleteAdmins: async ({ request }) => {
        return deleteAdmins(request);
    },
    // ================================================
    
    // actionsemployeeadd.ts
    addEmployee: async ({ request }) => {
        return addEmployee(request);
    },
    // ================================================

    // actionshearingdata.ts
    checkYearAvailability: async ({ request }) => {
        return checkYearAvailability(request);
    },
    addHearingData: async ({ request }) => {
        return addHearingData(request);
    },
    modifyHearingData: async ({ request }) => {
        return modifyHearingData(request);
    },
    // ================================================

<<<<<<< HEAD
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
                    VALUES (${employeeId}, ${leftEarDataId}, ${year}, 'left');
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
                    VALUES (${employeeId}, ${rightEarDataId}, ${year}, 'right');
                `;
            }
    
        } catch (error: any) {
            console.log("Error modifying employee's hearing data:", error.message);
            return { success: false, message: "Failed to modify employee's hearing data due to error" };
        }
    
        return JSON.stringify({
            success: true,
        });
    },
    
    exportEmployeeData: async ({ request }) => {
        const formData = await request.formData();
        const employeeID = formData.get('employeeID') as string;
        const first_name = formData.get('first_name') as string;
        const last_name = formData.get('last_name') as string;
        const email = formData.get('email') as string;

        try {
            // Query to get all employee and hearing data
            const employeeDataQuery = await sql`
                SELECT
                    e.employee_id,
                    e.first_name,
                    e.last_name,
                    e.email,
                    e.date_of_birth,
                    e.last_active,
                    h.year,
                    h.ear,
                    d.Hz_500,
                    d.Hz_1000,
                    d.Hz_2000,
                    d.Hz_3000,
                    d.Hz_4000,
                    d.Hz_6000,
                    d.Hz_8000 
                FROM Employee e
                LEFT JOIN Has h ON e.employee_id = h.employee_id
                LEFT JOIN Data d ON h.data_id = d.data_id
                ORDER BY e.employee_id, h.year, h.ear;
            `;
    
            const employeeData = employeeDataQuery.rows[0];

            const dataReturnTest = {
                success: true,
                employeeData
            }

            console.log(JSON.stringify(dataReturnTest));

            JSON.stringify({
                success: true,
                data: employeeData.rows
            });  
        } catch (error: any) {
            console.error('Error fetching employee data:', error.message);
            return JSON.stringify({
                success: false,
                message: 'Failed to fetch employee data'
            });
        }
    }
=======
    // actionsemployees.ts
    fetchYears: async ({ request }) => {
        return fetchYears(request);
    },
    fetchEmployeeInfo: async ({ request }) => {
        return fetchEmployeeInfo(request);
    }, 
    fetchHearingData: async ({ request }) => {
       return fetchHearingData(request);
    },
    fetchHearingDataForYear: async ({ request }) => {
        return fetchHearingDataForYear(request);
     },
    modifyEmployeeName: async ({ request }) => {
        return modifyEmployeeName(request);
    },
    modifyEmployeeEmail: async ({ request }) => {
        return modifyEmployeeEmail(request);
    },
    modifyEmployeeDOB: async ({ request }) => {
        return modifyEmployeeDOB(request);
    },
    modifyEmployeeStatus: async ({ request }) => {
        return modifyEmployeeStatus(request);
    },
    calculateSTS: async ({ request }) => { 
        return calculateSTS(request);
    }
    // ================================================

    // actionsmailing.ts
    // TODO: make actions for mailing
>>>>>>> 727e42dc4863ffea82dd0d9fe6092998c1524db6
};