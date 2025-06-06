import type { Actions, PageServerLoad } from './$types';
import { turnAwayNonAdmins } from '$lib/utility';
import { addHearingScreening } from '$lib/server/actionshearingdata';
import { modifyEmployeeDOB, modifyEmployeeEmail, modifyEmployeeName, modifyEmployeeStatus, modifyEmployeeSex, extractEmployeeHearingScreenings, extractEmployeeInfo, extractEmployeeHearingHistory, extractAllEmployeeHearingHistories, extractEmployeeHearingScreening, checkEmployeeHearingScreening } from '$lib/server/actionsemployees';
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
    addHearingScreening: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return addHearingScreening(request);
    },
    // ================================================

    // actionsemployees.ts
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
    checkEmployeeHearingScreening: async ({ request, locals }) => {
        const [sessionIsValid, message]: [boolean, string | undefined] = await validSession(locals);
        if (!sessionIsValid) return fail(401, {message});
        return checkEmployeeHearingScreening(request);
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