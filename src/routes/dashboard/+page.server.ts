import type { Actions, PageServerLoad } from './$types';
import { turnAwayNonAdmins } from '$lib/utility';
import { addHearingData, checkYearAvailability, modifyHearingData, fetchCalculateSTSData } from '$lib/server/actionshearingdata';
import { fetchEmployeeInfo, fetchYears, modifyEmployeeDOB, modifyEmployeeEmail, modifyEmployeeName, modifyEmployeeStatus, modifyEmployeeSex, calculateSTS, extractEmployeeHearingScreenings, extractEmployeeInfo, extractEmployeeHearingHistory, extractAllEmployeeHearingHistories, extractEmployeeHearingScreening } from '$lib/server/actionsemployees';
import { addEmployee } from '$lib/server/actionsemployeeadd';
import { deleteAdmins, modifyAdminName, modifyAdminPermissions } from '$lib/server/actionsadmins';
import { getAdminsFromDatabase, getEmployeesFromDatabase, isEmailAnAdmin } from '$lib/server/databasefunctions';
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
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return modifyAdminPermissions(request);
    },
    modifyAdminName: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return modifyAdminName(request);
    },
    deleteAdmins: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return deleteAdmins(request);
    },
    // ================================================
    
    // actionsemployeeadd.ts
    addEmployee: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return addEmployee(request);
    },
    // ================================================

    // actionshearingdata.ts
    checkYearAvailability: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return checkYearAvailability(request);
    },
    addHearingData: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return addHearingData(request);
    },
    modifyHearingData: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return modifyHearingData(request);
    },
    // ! to be removed later
    fetchCalculateSTSData: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message}); 
        return fetchCalculateSTSData(request);
    },
    // ================================================

    // actionsemployees.ts
    // ! to be removed later
    fetchYears: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return fetchYears(request);
    },
    // ! to be removed later
    fetchEmployeeInfo: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return fetchEmployeeInfo(request);
    },
    extractEmployeeInfo: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return extractEmployeeInfo(request);
    },
    modifyEmployeeName: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return modifyEmployeeName(request);
    },
    modifyEmployeeEmail: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return modifyEmployeeEmail(request);
    },
    modifyEmployeeDOB: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return modifyEmployeeDOB(request);
    },
    modifyEmployeeStatus: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return modifyEmployeeStatus(request);
    },
    modifyEmployeeSex: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return modifyEmployeeSex(request);
    },
    extractEmployeeHearingScreening: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return extractEmployeeHearingScreening(request);
    },
    extractEmployeeHearingScreenings: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return extractEmployeeHearingScreenings(request);
    },
    extractEmployeeHearingHistory: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return extractEmployeeHearingHistory(request);
    },
    extractAllEmployeeHearingHistories: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return extractAllEmployeeHearingHistories(request);
    },
    // ================================================
};

async function validSession(locals: App.Locals): Promise<[boolean, string | undefined]> {
    const session = await locals.auth();
    
    if (!session?.user || !session.user.email) return [false, "Session was not valid."];
    else if (!await isEmailAnAdmin(session.user.email)) return [false, "You are not an administrator."]
    else return [true, undefined]
}