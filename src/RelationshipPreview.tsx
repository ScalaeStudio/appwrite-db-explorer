import { OpenInFull } from "@mui/icons-material";
import { Button, Popover } from "@mui/material";
import { Models } from "node-appwrite";
import { useState } from "react";

const columnsToIgnore = [
    '$updatedAt',
    '$permissions',
    '$databaseId',
    '$collectionId',
];

export default function RelationshipPreview({
    document,
    navigateToDocument,
}: {
    document: Models.Document,
    navigateToDocument: (collection: string, documentId: string) => void,
}) {

    const [open, setOpen] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    return (
        <>
        <span
            onClick={(event) => {
                setAnchorEl(event.currentTarget);
                setOpen(!open);
            }}
            style={{
                textDecoration: 'underline',
                cursor: 'pointer',
            }}
        >{document.$id}</span>
        <Popover
            open={open}
            anchorEl={anchorEl}
            anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
            }}
            transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
            }}
            sx={{ maxWidth: '30vw' }}
            onClose={() => setOpen(false)}
            disableRestoreFocus>
                <div style={{padding: '20px', overflow: 'auto' }}>
                    {
                        Object.keys(document)
                        .filter((key) => columnsToIgnore.indexOf(key) === -1)
                        .map((key: string) => (
                            <div key={key} style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
                                <span style={{ fontSize: '12px' }}>{key}</span>
                                {
                                    typeof document[key] !== 'object'
                                    && <span style={{ fontWeight: 'bold' }}>{document[key].toString()}</span>
                                }
                                {
                                    typeof document[key] === 'object'
                                    && document[key].$id
                                    && <RelationshipPreview
                                            document={document[key]}
                                            navigateToDocument={navigateToDocument} />
                                }
                                {
                                    Array.isArray(document[key])
                                    && <span style={{ fontWeight: 'bold' }}>Array of size {document[key].length}</span>
                                }
                            </div>
                        ))
                    }
                    <Button
                        startIcon={<OpenInFull />}
                        onClick={() => navigateToDocument(document.$collectionId, document.$id)}
                        >Open</Button>
                </div>
        </Popover>
        </>
    );
}
