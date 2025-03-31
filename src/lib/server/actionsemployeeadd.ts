// actionsemployeeadd.ts
// Contains server functions pertaining to adding employees

import { insertEmployeeIntoDatabase } from '$lib/server/databasefunctions';

export async function addEmployee(request: Request) {
    const formData = await request.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;
    const sex = formData.get('sex') as string;
    const isInactive = formData.get('isInactive') === 'true';
    const lastActive = isInactive ? formData.get('lastActive') as string : null;

    try {
        // Insert new employee into the database (adjust as needed for your DB schema)
        await insertEmployeeIntoDatabase(firstName, lastName, email, dateOfBirth, sex, lastActive);
    } 
    catch (error: any) {
        const errorMessage = "Error in database when adding employee: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }

    return JSON.stringify({
        success: true,
    });
}