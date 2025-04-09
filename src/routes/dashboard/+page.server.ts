import type { Actions, PageServerLoad } from './$types';
import { turnAwayNonAdmins } from '$lib/utility';
import { addHearingData, checkYearAvailability, modifyHearingData, fetchCalculateSTSData } from '$lib/server/actionshearingdata';
import { fetchEmployeeInfo, fetchHearingData, fetchHearingDataForYear, fetchYears, modifyEmployeeDOB, modifyEmployeeEmail, modifyEmployeeName, modifyEmployeeStatus, modifyEmployeeSex, calculateSTS, extractEmployeeHearingScreenings, extractEmployeeInfo, extractEmployeeHearingHistory, extractAllEmployeeHearingHistories } from '$lib/server/actionsemployees';
import { addEmployee } from '$lib/server/actionsemployeeadd';
import { deleteAdmins, modifyAdminName, modifyAdminPermissions } from '$lib/server/actionsadmins';
import { extractAllEmployeeData, extractHearingData, extractBaselineHearingData, extractRecentHearingData } from '$lib/server/actionsmailing';
import { getAdminsFromDatabase, getEmployeesFromDatabase } from '$lib/server/databasefunctions';


export const load: PageServerLoad = async ( event ) => {
    await turnAwayNonAdmins(event);

    // TODO: error handling
    // TODO: change getEmployeesFromDataBase() to extractEmployeeInfos() -> will return EmployeeInfo[] instead of Employee[]
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
    // ! to be removed later
    fetchCalculateSTSData: async ({ request }) => { 
        return fetchCalculateSTSData(request);
    },
    // ================================================

    // actionsemployees.ts
    // ! to be removed later
    fetchYears: async ({ request }) => {
        return fetchYears(request);
    },
    // ! to be removed later
    fetchEmployeeInfo: async ({ request }) => {
        return fetchEmployeeInfo(request);
    },
    extractEmployeeInfo: async ({ request }) => {
        return extractEmployeeInfo(request);
    },
    // ! to be removed later
    fetchHearingData: async ({ request }) => {
       return fetchHearingData(request);
    },
    // ! to be removed later
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
    modifyEmployeeSex: async ({ request }) => {
        return modifyEmployeeSex(request);
    },
    // ! to be removed later
    calculateSTS: async ({ request }) => { 
        return calculateSTS(request);
    },
    extractEmployeeHearingScreenings: async ({ request }) => {
        return extractEmployeeHearingScreenings(request);
    },
    extractEmployeeHearingHistory: async ({ request }) => {
        return extractEmployeeHearingHistory(request);
    },
    extractAllEmployeeHearingHistories: async ({ request }) => {
        return extractAllEmployeeHearingHistories(request);
    },
    // ================================================

    // actionsmailing.ts
    // ! to be removed later
    extractAllEmployeeData: async ({ request }) => {
        return extractAllEmployeeData(request);
    },
    // ! to be removed later
    extractHearingData: async ({ request }) => {
        return extractHearingData(request);
    },
    // ! to be removed later
    extractBaselineHearingData: async ({ request }) => {
        return extractBaselineHearingData(request);
    },
    // ! to be removed later
    extractRecentHearingData: async ({ request }) => {
        return extractRecentHearingData(request);
    }
    // ================================================
};