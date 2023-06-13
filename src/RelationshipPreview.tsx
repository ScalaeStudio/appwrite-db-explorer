import { Popover } from "@mui/material";
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
}: { document: Models.Document, }) {

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
                                    && <span style={{ fontWeight: 'bold' }}>{document[key].$id}</span>
                                }
                                {
                                    Array.isArray(document[key])
                                    && <span style={{ fontWeight: 'bold' }}>Array of size {document[key].length}</span>
                                }
                            </div>
                        ))
                    }
                </div>
        </Popover>
        </>
    );
}
