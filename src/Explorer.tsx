import { Models } from "appwrite";
import { useEffect, useState } from "react";
import { getDatabase } from "./appwrite";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { Query } from "node-appwrite";

export default function Explorer({
    database, collection,
}: { database: string, collection: string, }) {

    const [data, setData] = useState<Models.DocumentList<Models.Document>>({ total: 0, documents: [] });
    const [loading, setLoading] = useState<boolean>(false);

    const loadCollection = async () => {
        setLoading(true);
        const db = getDatabase();
        setData(await db.listDocuments(
            database,
            collection,
            [
                Query.limit(100),
            ]
        ));
        setLoading(false);
    };

    useEffect(() => {
        loadCollection();
    }, [database, collection]);

    const getColumns = (): GridColDef[] => {
        const ignore = ['$updatedAt', '$databaseId', '$collectionId'];
        const columns: GridColDef[] = [];

        if (data.total > 0) {
            Object.keys(data.documents[0])
            .filter((field: string) => ignore.indexOf(field) < 0)
            .map((field: string) => {
                if (typeof data.documents[0][field] === 'string') {
                    columns.push({
                        headerName: field,
                        field,
                        type: 'string',
                        width: 250,
                        editable: !field.startsWith('$'),
                    });
                }
            });
        }

        return columns;
    }

    const onPaginationChange = (props) => {
        console.log(props);
    }

    return (
        <DataGrid
            rows={data.documents}
            columns={getColumns()}
            getRowId={(row) => row.$id}
            initialState={{
                pagination: {
                    paginationModel: {
                        pageSize: 100,
                    },
                },
            }}
            loading={loading}
            paginationMode="server"
            rowCount={data.total}
            onPaginationModelChange={onPaginationChange}
            disableRowSelectionOnClick
            />
        );
}