// actionsadmins.ts
// Contains server functions pertaining to admin actions

import { sql } from '@vercel/postgres';

export async function modifyAdminPermissions(request: Request) {
    const formData = await request.formData();
    const adminID = formData.get('adminID') as string;
    const isOp = formData.get('isOp') === 'true';

    try {
        const result = await sql`UPDATE Administrator SET isop = ${isOp} WHERE id=${adminID};`
        
        if (result.rowCount === 0) {
            return JSON.stringify({ success: false, message: 'No rows were updated. Admin ID might be incorrect.' });
        }

    } catch (error: any) {
        const errorMessage = "Error in database when modifying admin permissions: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }
    
    return JSON.stringify({
        success: true,
    });
}

export async function modifyAdminName(request: Request) {
    const formData = await request.formData();
    const adminID = formData.get('adminID') as string;
    const newName = formData.get('newName') as string;

    try {
        const result = await sql`UPDATE Administrator SET name = ${newName} WHERE id=${adminID};`
        
        if (result.rowCount === 0) {
            return JSON.stringify({ success: false, message: 'No rows were updated. Admin ID might be incorrect.' });
        }

    } catch (error: any) {
        const errorMessage = "Error in database when modifying admin name: " 
            + (error.message ?? "no error message provided by server");
        console.error(errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }

    return JSON.stringify({
        success: true,
    });
}

export async function deleteAdmins(request: Request) {
    // Retrieve the admin IDs from the form data
    const formData = await request.formData();
    const adminIDs: string = JSON.parse(formData.get('adminIDs') as string) as string;

    try {
        // Delete admin from database
        const result = await sql`
            DELETE FROM Administrator
            WHERE id = ANY(${adminIDs});
        `;

        // Check if any rows were deleted
        if (result.rowCount === 0) {
            return JSON.stringify({ success: false, message: 'No admins were deleted. Admin IDs might be incorrect.' });
        }

    } catch (error: any) {
        const errorMessage = "Error in database when deleting admins: " 
            + (error.message ?? "no error message provided by server");
        console.error('Failed to delete admins:', errorMessage);
        return JSON.stringify({ success: false, message: errorMessage });
    }

    return JSON.stringify({
        success: true,
    });
}
