import type { Actions, PageServerLoad } from './$types';
import { turnAwayNonAdmins } from '$lib/utility';
import { addHearingData, checkYearAvailability, modifyHearingData, fetchCalculateSTSData } from '$lib/server/actionshearingdata';
import { fetchEmployeeInfo, fetchYears, modifyEmployeeDOB, modifyEmployeeEmail, modifyEmployeeName, modifyEmployeeStatus, modifyEmployeeSex, calculateSTS, extractEmployeeHearingScreenings, extractEmployeeInfo, extractEmployeeHearingHistory, extractAllEmployeeHearingHistories, extractEmployeeHearingScreening } from '$lib/server/actionsemployees';
import { addEmployee } from '$lib/server/actionsemployeeadd';
import { deleteAdmins, modifyAdminName, modifyAdminPermissions } from '$lib/server/actionsadmins';
import { getAdminsFromDatabase, getEmployeesFromDatabase } from '$lib/server/databasefunctions';
import { fail } from '@sveltejs/kit';


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
    modifyAdminPermissions: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return modifyAdminPermissions(request);
    },
    modifyAdminName: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return modifyAdminName(request);
    },
    deleteAdmins: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return deleteAdmins(request);
    },
    // ================================================
    
    // actionsemployeeadd.ts
    addEmployee: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return addEmployee(request);
    },
    // ================================================

    // actionshearingdata.ts
    checkYearAvailability: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return checkYearAvailability(request);
    },
    addHearingData: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return addHearingData(request);
    },
    modifyHearingData: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return modifyHearingData(request);
    },
    // ! to be removed later
    fetchCalculateSTSData: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."}); 
        return fetchCalculateSTSData(request);
    },
    // ================================================

    // actionsemployees.ts
    // ! to be removed later
    fetchYears: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return fetchYears(request);
    },
    // ! to be removed later
    fetchEmployeeInfo: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return fetchEmployeeInfo(request);
    },
    extractEmployeeInfo: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return extractEmployeeInfo(request);
    },
    modifyEmployeeName: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return modifyEmployeeName(request);
    },
    modifyEmployeeEmail: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return modifyEmployeeEmail(request);
    },
    modifyEmployeeDOB: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return modifyEmployeeDOB(request);
    },
    modifyEmployeeStatus: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return modifyEmployeeStatus(request);
    },
    modifyEmployeeSex: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return modifyEmployeeSex(request);
    },
    extractEmployeeHearingScreening: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return extractEmployeeHearingScreening(request);
    },
    extractEmployeeHearingScreenings: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return extractEmployeeHearingScreenings(request);
    },
    extractEmployeeHearingHistory: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return extractEmployeeHearingHistory(request);
    },
    extractAllEmployeeHearingHistories: async ({ request, locals }) => {
        if (!(await validSession(locals))) return fail(401, {message: "Session was not valid."});
        return extractAllEmployeeHearingHistories(request);
    },
    // ================================================
};

async function validSession(locals: App.Locals): Promise<boolean> {
    const session = await locals.auth();
    return !!session?.user; // checks if the session exists
}