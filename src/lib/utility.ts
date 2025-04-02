import type { Session } from "@auth/sveltekit";
import { redirect, type RequestEvent, type Server, type ServerLoadEvent } from "@sveltejs/kit"
import { sql, type QueryResult, type QueryResultRow } from "@vercel/postgres";
import { PageCategory, type Admin, type Employee, type HearingDataSingle } from "./MyTypes";
import { UserHearingScreeningHistory, HearingScreening, HearingDataOneEar, PersonSex, AnomalyStatus } from './interpret';

export function isNumber(value?: string | number): boolean {
    return ((value != null) &&
            (value !== '') &&
            !isNaN(Number(value.toString())));
}

export function isDate(value: unknown): value is Date {
    return value instanceof Date && !isNaN(+value);
}

export enum AdminStatus {
    NotListed,
    NoPerms,
    HasPerms
}

export enum LoginStatus {
    None,
    NoPerms,
    HasPerms,
    NoSession,
    NoID,
    NoName,
    NoEmail
}

export const loginMessages: Record<LoginStatus, string> = {
    [LoginStatus.NoPerms]: "Please wait for an SLHC administrator to verify you.",
    [LoginStatus.None]: "Please wait for an SLHC administrator to verify you.",
    [LoginStatus.HasPerms]: "Welcome back!",
    [LoginStatus.NoSession]: "There was an issue with your session. Try logging out and logging back in.",
    [LoginStatus.NoID]: "There was an unusual issue with your session. Try logging out and logging back in.",
    [LoginStatus.NoName]: "Your Google Account does not have a name attached, so we could not create an SLHC account for you.",
    [LoginStatus.NoEmail]: "There is no email associated with your Google account, so we could not create an SLHC account for you.",
};

export function handleSearchRedirect(event: RequestEvent) {
    const redirectTo = event.url.pathname + event.url.search;
    return '/dashboard?redirectTo=${redirectTo}';
}

export async function addUserToAdminDatabase(userEmail: string, name: string): Promise<void> {
    try {
        await sql`
            INSERT INTO administrator (userstring, name, isop)
            VALUES (${userEmail}, ${name}, false)
        `;
        console.log(`User ${name} (${userEmail}) successfully added to the admin database with isOP set to false.`);
    } catch (error) {
        console.error("Error adding user to the admin database:", error);
    }
}

export async function obtainLoginStatus(event: ServerLoadEvent): Promise<LoginStatus> {
    const session = await event.locals.auth();

    if (session) {
        const adminStatus = await checkAdminStatus(session);
        switch (adminStatus) {
            case AdminStatus.HasPerms:
                return LoginStatus.HasPerms;

            case AdminStatus.NoPerms:
                return LoginStatus.NoPerms;

            case AdminStatus.NotListed:
                console.log("Not Listed");
                if (!session.user) return LoginStatus.NoSession;
                if (!session.user.email) return LoginStatus.NoEmail;
                if (!session.user.name) return LoginStatus.NoName;

                // all checks passed, let's make a new user
                const email = session.user.email;
                const name = session.user?.name;
                await addUserToAdminDatabase(email, name);
                
                return LoginStatus.NoPerms;
        }
    }

    return LoginStatus.None;
}

export async function checkAdminStatus(session: Session): Promise<AdminStatus> {
    console.log('Verifying if user is an administrator');

    try {
        if (!session) {
            throw new Error('No active session');
        }

        const userEmail = session.user?.email;

        const result = await sql`
            SELECT isop
            FROM administrator
            WHERE userstring = ${userEmail}
        `;

        if (result.rowCount == 0) {
            // They're not yet in the database, we need to add them
            return AdminStatus.NotListed;
        }

        const isAdmin = result.rows.length > 0 && result.rows[0].isop === true;
        console.log("Query result:", result.rows);
        console.log("Admin status:", isAdmin);

        if (isAdmin) {
            return AdminStatus.HasPerms;
        }
        else {
            return AdminStatus.NoPerms;
        }
    } 
    catch (error) {
        console.error("Error verifying administrator status", error);
        return AdminStatus.NotListed;
    }
}

export async function turnAwayNonAdmins(event: ServerLoadEvent) {
    const loginStatus = await obtainLoginStatus(event);
    
    if (loginStatus != LoginStatus.HasPerms) {
        console.log("User does not have sufficient permissions");
        redirect(303, '/');
    }
}

export async function getEmployeesFromDatabase(): Promise<Employee[]> {
    // TODO: move to databasefunctions
    const employeeTable = await sql`SELECT * FROM Employee;`;

    const employees: Employee[] = employeeTable.rows.map(row => ({
        activeStatus: row.last_active,
        employeeID: row.employee_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        dob: row.date_of_birth,
        sex: row.sex
    }));

    return employees;
}

export async function getHearingDataFromDatabaseRow(row: QueryResultRow): Promise<HearingDataSingle> {
    const parsedHearingData: HearingDataSingle = {
        hz500: row["hz_500"] ?? "CNT",
        hz1000: row["hz_1000"] ?? "CNT",
        hz2000: row["hz_2000"] ?? "CNT",
        hz3000: row["hz_3000"] ?? "CNT",
        hz4000: row["hz_4000"] ?? "CNT",
        hz6000: row["hz_6000"] ?? "CNT",
        hz8000: row["hz_8000"] ?? "CNT"
    };

    return parsedHearingData;
}

export async function getAdminsFromDatabase(): Promise<Admin[]> {
    // TODO: move to databasefunctions
    const adminTable = await sql`SELECT * FROM Administrator;`;

    const admins: Admin[] = adminTable.rows.map(row => ({
        name: row.name,
        email: row.userstring,
        id: row.id,
        isOP: row.isop,
        selected: false
    }));

    return admins;
}

export function extractFrequencies(earData: Record<string, any>): number[] {
    const { ear, ...frequencies } = earData; // Exclude the 'ear' property
    return Object.values(frequencies) as number[];  // Return all frequency values as an array of numbers
};

export function validateFrequencies(frequencies: Record<string, string | number>): boolean {
    return Object.values(frequencies).every(value => 
        value === null || 
        value === "CNT" || 
        (!isNaN(parseInt(value as string, 10)) && parseInt(value as string, 10) >= -10 && parseInt(value as string, 10) <= 90)
    );
}

export function validateFrequenciesLocally(frequenciesLeft: HearingDataSingle, frequenciesRight: HearingDataSingle): boolean {
    const validateFrequencies = (freqs: HearingDataSingle) =>
        Object.values(freqs).every(value => 
            value === "CNT" || 
            (!isNaN(parseInt(value as string, 10)) && parseInt(value as string, 10) >= -10 && parseInt(value as string, 10) <= 90)
        );
    return validateFrequencies(frequenciesLeft) && validateFrequencies(frequenciesRight);
}

export function getPageCategory(page: string): PageCategory {
    switch (page.toLowerCase()) {
        case 'home':
            return PageCategory.Home;
        case 'employee':
            return PageCategory.Employee;
        case 'admin':
            return PageCategory.Admin;
        case 'mailing':
            return PageCategory.Mailing;
        default:
            return PageCategory.Other;
    }
}

// respects proper baselines
export function calculateSTSClientSide(hearingData: any) {
    // Convert raw hearing data to the format required by UserHearingScreeningHistory
    const screenings = Object.entries(hearingData.screenings)
        .map(([year, data]) => new HearingScreening(
            parseInt(year),
            new HearingDataOneEar(
                data.left.hz500 ?? null,
                data.left.hz1000 ?? null,
                data.left.hz2000 ?? null,
                data.left.hz3000 ?? null,
                data.left.hz4000 ?? null,
                data.left.hz6000 ?? null,
                data.left.hz8000 ?? null
            ),
            new HearingDataOneEar(
                data.right.hz500 ?? null,
                data.right.hz1000 ?? null,
                data.right.hz2000 ?? null,
                data.right.hz3000 ?? null,
                data.right.hz4000 ?? null,
                data.right.hz6000 ?? null,
                data.right.hz8000 ?? null
            )
        ));

    // Sort screenings by year
    screenings.sort((a, b) => a.year - b.year);
    
    // Calculate age based on date of birth and current year
    const dob = new Date(hearingData.dateOfBirth);
    const dobYear = dob.getFullYear();
    
    // Determine sex
    const personSex = hearingData.sex === "Male" ? PersonSex.Male : 
                    hearingData.sex === "Female" ? PersonSex.Female : 
                    PersonSex.Other;
    
    // Process each screening with its proper baseline
    const reports = [];
    
    // Find the oldest year's data (first baseline)
    let leftBaselineIndex = 0;
    let rightBaselineIndex = 0;
    let leftBaselineYear = screenings[0].year;
    let rightBaselineYear = screenings[0].year;
    
    // Process each year relative to its proper baseline
    for (let i = 0; i < screenings.length; i++) {
        const currentYear = screenings[i].year;
        const age = currentYear - dobYear;
        
        // If this is a baseline year or the first year, set it as its own baseline
        if (i === 0) {
            // This is a baseline year - no previous data to compare against
            reports.push({
                reportYear: currentYear,
                leftStatus: AnomalyStatus.Baseline,
                rightStatus: AnomalyStatus.Baseline,
                leftBaselineYear: currentYear,
                rightBaselineYear: currentYear
            });
        } else {
            // Compare against left baseline
            const leftBaselineScreening = screenings[leftBaselineIndex];
            const rightBaselineScreening = screenings[rightBaselineIndex];
            
            // Create separate history objects for left and right ears
            const leftHistoryForComparison = new UserHearingScreeningHistory(
                age,
                personSex,
                currentYear,
                [leftBaselineScreening, screenings[i]]
            );
            
            const rightHistoryForComparison = new UserHearingScreeningHistory(
                age,
                personSex,
                currentYear,
                [rightBaselineScreening, screenings[i]]
            );
            
            // Generate reports for this specific comparison
            const leftYearReport = leftHistoryForComparison.GenerateHearingReport()
                .find(report => report.reportYear === currentYear);
                
            const rightYearReport = rightHistoryForComparison.GenerateHearingReport()
                .find(report => report.reportYear === currentYear);
            
            if (leftYearReport && rightYearReport) {
                reports.push({
                    reportYear: currentYear,
                    leftStatus: leftYearReport.leftStatus,
                    rightStatus: rightYearReport.rightStatus,
                    leftBaselineYear: leftBaselineYear,
                    rightBaselineYear: rightBaselineYear
                });
            }
            
            // Check if we need to update the baselines
            const leftHasSignificantImprovement = 
                leftYearReport && leftYearReport.leftStatus === AnomalyStatus.NewBaseline;
                
            const rightHasSignificantImprovement = 
                rightYearReport && rightYearReport.rightStatus === AnomalyStatus.NewBaseline;
                
            if (leftHasSignificantImprovement) {
                // Set this year as the new baseline for future calculations for left ear
                leftBaselineIndex = i;
                leftBaselineYear = currentYear;
            }
            
            if (rightHasSignificantImprovement) {
                // Set this year as the new baseline for future calculations for right ear
                rightBaselineIndex = i;
                rightBaselineYear = currentYear;
            }
        }
    }
    
    return reports;
}