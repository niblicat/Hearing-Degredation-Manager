import type { Actions, PageServerLoad } from './$types';
import { getAdminsFromDatabase, getEmployeesFromDatabase, turnAwayNonAdmins } from '$lib/utility';
import { addHearingData, checkYearAvailability, modifyHearingData } from '$lib/actionshearingdata';
import { fetchEmployeeInfo, fetchHearingData, fetchYears, modifyEmployeeDOB, modifyEmployeeEmail, modifyEmployeeName, modifyEmployeeStatus } from '$lib/actionsemployees';
import { addEmployee } from '$lib/actionsemployeeadd';
import { deleteAdmins, modifyAdminName, modifyAdminPermissions } from '$lib/actionsadmins';

export const load: PageServerLoad = async ( event ) => {
    await turnAwayNonAdmins(event);

    const employees = await getEmployeesFromDatabase();
    const admins = await getAdminsFromDatabase();

    return {
        employees: employees,
        admins: admins
    };
};

// Actions for login and registration
export const actions: Actions = {
    // actionsadmins.ts
    modifyAdminPermissions: async ({request}) => {
        return modifyAdminPermissions(request);
    },
    modifyAdminName: async ({request}) => {
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

    // actionsemployees.ts
    fetchYears: async ({request}) => {
        return fetchYears(request);
    },
    fetchEmployeeInfo: async ({ request }) => {
        return fetchEmployeeInfo(request);
    }, 
    fetchHearingData: async ({ request }) => {
       return fetchHearingData(request);
    },
    modifyEmployeeName: async ({request}) => {
        return modifyEmployeeName(request);
    },
    modifyEmployeeEmail: async ({request}) => {
        return modifyEmployeeEmail(request);
    },
    modifyEmployeeDOB: async ({request}) => {
        return modifyEmployeeDOB(request);
    },
    modifyEmployeeStatus: async ({request}) => {
        return modifyEmployeeStatus(request);
    }
    // ================================================

    // actionsmailing.ts
    // TODO: make actions for mailing
};