import information from '$lib/Information/information.json';
import { PageCategory } from '$lib/MyTypes';
import { getPageCategory } from '$lib/utility';

export type InformationPerCategory = {
    category: PageCategory,
    header: string,
    points: string[]
    sub: {
        header: string,
        points: string[]
    }[]
}

/**
 * Takes all the categories and information from information.json and creates an array
 * of the information with the associated PageCategory
 * @returns An array of InformationPerCategory from information.json
 */
export function getInformationPerCategory(): InformationPerCategory[] | null {
    const result: InformationPerCategory[] | null = information.map(item => {
        const category: PageCategory = getPageCategory(item.category);
        if (category === PageCategory.Other) return null;
        
        return {
            category,
            header: item.header,
            points: item.points,
            sub: item.sub
        } as InformationPerCategory;
    })
    .filter((item): item is InformationPerCategory => item !== null);
    
    return result;
}