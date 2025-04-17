<script lang="ts">
    import { Accordion, AccordionItem, Li, List } from "flowbite-svelte";
    import { PageCategory } from "$lib/MyTypes";
    import { getInformationPerCategory, type InformationPerCategory } from "./infopercategory.svelte";

    interface Props {
        page?: PageCategory
    }
    const defaultCategory = PageCategory.Home;

    let {page = defaultCategory}: Props = $props();

    let informationPerCategory: InformationPerCategory[] | null = getInformationPerCategory();
    let singleInformation: InformationPerCategory | undefined = $derived.by(() => {
        return informationPerCategory?.find((item) => item.category === page);
    })
</script>

{#if page == PageCategory.Home}
    {#if informationPerCategory}
        <Accordion>
            {#each informationPerCategory as main}
                <AccordionItem class="cursor-pointer">
                    <span slot="header">{main.header}</span>
                    {#each main.points as point}
                        <Li>{@html point}</Li>
                    {/each}
                    {#if main.sub}
                        <br>
                        <Accordion>
                            {#each main.sub as sub}
                                <AccordionItem class="cursor-pointer">
                                <span slot="header">{sub.header}</span>
                                {#each sub.points as point}
                                    <Li>{@html point}</Li>
                                {/each}
                            </AccordionItem>
                            {/each}
                        </Accordion>
                    {/if}
                </AccordionItem>
            {/each}
        </Accordion>
    {/if}
{:else}
    {#if singleInformation}
        <List position="inside">
            {#each singleInformation.points as point}
            <Li>{@html point}</Li>
            {/each}
        </List>
        {#if singleInformation.sub}
            <Accordion>
                {#each singleInformation.sub as sub}
                    <AccordionItem class="cursor-pointer">
                    <span slot="header">{sub.header}</span>
                    {#each sub.points as point}
                        <Li>{@html point}</Li>
                    {/each}
                </AccordionItem>
                {/each}
            </Accordion>
        {/if}
    {/if}
{/if}