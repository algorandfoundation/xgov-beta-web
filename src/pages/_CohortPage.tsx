import { Link, type LinkProps } from "@components/Link";
import { Page } from "@components/Page";
import type { ComponentType } from "react";

const title = 'xGov';

export function CohortsPage(){
    // TODO Handle other pages operations
    return (
        <Page title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}>
            Hello Cohorts
        </Page>
    )
}