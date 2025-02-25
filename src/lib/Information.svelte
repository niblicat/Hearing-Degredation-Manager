<script lang="ts">
    import { Accordion, AccordionItem, Li, List } from "flowbite-svelte";
</script>

<Accordion>
    <AccordionItem>
        <span slot="header">Learn about the Admins Page</span>
        <p class="text-gray-500 dark:text-gray-400">
        <Li>Make other registered users admins by clicking the edit icon in the "is admin" column</Li>
        <Li>Edit information about any admin by clicking the edit icon next to the item or the "edit" button in the far right columm</Li>
        <Li>Delete admin(s) by selecting the box in the far left column then clicking the delete button towards the bottom</Li>
        </p>
    </AccordionItem>
    <AccordionItem>
        <span slot="header">Learn about the Employees Page</span>
        <Li>Select an employee and year from the drop down menus towards the top</Li>
        <Li>Employee information is displayed on the left and the hearing data graph is displayed on the right</Li>
        <Li>Select the "Print" button to print out this information</Li>
        <Li>Select the "Send Letter" button to print out this information</Li>
        <br>
        <Accordion class="bg-gray-100">
            <AccordionItem>
                <span slot="header">Learn more about the graph</span>
                <p class="text-gray-500 dark:text-gray-400"></p>
                <Li>The graph has a "Left," "Right," and "Both" option to view specific sides</Li>
                <Li>Hovering and clicking on points of the graph give the specific coordinates</Li>
                <Li>Selecting the colors in the top legend with disable/enable that specific data set from being shown</Li>
            </AccordionItem>
        </Accordion>
    </AccordionItem>
    <AccordionItem>
        <span slot="header">Learn about the Mailings Page Page</span>
        <List tag="ul" class="ps-5 mt-2 space-y-1">
            <Li>Select the "Mail Merge" button to start a mail merge</Li>
            <Li>more info to come soon</Li>
        </List>
    </AccordionItem>
    <AccordionItem>
        <span slot="header">Learn about the Insert Employee Page</span>
        <Li>Input the employee's first name, last name, SIUE email, date of birth, and employement status</Li>
        <Li>If the employee is not employeed, a new input menu appears to add in their last employement date</Li>
        <Li>Once information is inputted, click submit to add them to the employee table</Li>
    </AccordionItem>
    <AccordionItem>
        <span slot="header">Learn about the Insert Data Page</span>
        <Li>Select employee to add data to and input year</Li>
        <Li>Input left and right ear data</Li>
        <Li>Submit information to add it to the data table</Li>
        <Li>If a value could not be tested, submit 'CNT' as the value</Li>
    </AccordionItem>
</Accordion>