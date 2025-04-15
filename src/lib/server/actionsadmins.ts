// actionsadmins.ts
// Contains server functions pertaining to admin actions

import { error } from '@sveltejs/kit';
import { deleteAdminsFromDatabase, modifyAdminNameFromDatabase, modifyAdminPermissionsFromDatabase } from './databasefunctions';
import { sql } from '@vercel/postgres';

export async function modifyAdminPermissions(request: Request) {
    const formData = await request.formData();
    const adminID = formData.get('adminID') as string;
    const isOp = formData.get('isOp') === 'true';

    try {
        await modifyAdminPermissionsFromDatabase(adminID, isOp);
    }
    catch (e: any) {
        const errorMessage = "Error in database when modifying admin permissions: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }

}

export async function modifyAdminName(request: Request) {
    const formData = await request.formData();
    const adminID = formData.get('adminID') as string;
    const newName = formData.get('newName') as string;

    try {
        await modifyAdminNameFromDatabase(adminID, newName);
    }
    catch (e: any) {
        const errorMessage = "Error in database when modifying admin name: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }
}

export async function deleteAdmins(request: Request) {
    // Retrieve the admin IDs from the form data
    const formData: FormData = await request.formData();
    const adminIDs: string[] = JSON.parse(formData.get('adminIDs') as string) as string[];

    try {
        await deleteAdminsFromDatabase(adminIDs);
    }
    catch (e: any) {
        const errorMessage = "Error in database when deleting admins: " 
            + (e.message ?? "no error message provided by server");
        console.error('Failed to delete admins:', errorMessage);
        error(404, { message: errorMessage });
    }
}
