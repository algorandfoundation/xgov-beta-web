import { Page } from "@components/Page";

const title = 'xGov';

export function DocsPage(){
    // TODO Handle other pages operations
    return (
        <Page title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}>
            Hello Docs,
        </Page>
    )
}