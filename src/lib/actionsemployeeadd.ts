import { sql } from '@vercel/postgres';

interface Request {
    formData: () => Promise<FormData>;
}

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
        const result = await sql`
            INSERT INTO Employee (first_name, last_name, email, date_of_birth, sex, last_active)
            VALUES (${firstName}, ${lastName}, ${email}, ${dateOfBirth}, ${sex}, ${lastActive});
        `;
    
        if (result.rowCount === 0) {
            return JSON.stringify({ success: false, message: 'Database failure when adding employee' });
        }

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