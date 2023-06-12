import { useEffect, useMemo, useState } from "react";
import { getDatabase } from "./appwrite";
import {
    DataGrid,
    GridColDef,
    GridFilterModel,
    GridPaginationModel,
    getGridBooleanOperators,
    getGridStringOperators,
    getGridDateOperators,
    GridSortModel,
} from '@mui/x-data-grid';
import { Models, Query } from "node-appwrite";
import toast from "react-hot-toast";

export default function Explorer({
    database, collection,
}: { database: string, collection: string, }) {

    const [data, setData] = useState<Models.DocumentList<Models.Document>>({ total: 0, documents: [] });
    const [fields, setFields] = useState<Models.AttributeList>({ total: 0, attributes: [] });
    const [loading, setLoading] = useState<boolean>(false);
    const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 100, });
    const [filter, setFilter] = useState<GridFilterModel>({ items: [], });
    const [sort, setSort] = useState<GridSortModel>([]);

    console.log(sort);

    const filters: string[] = useMemo<string[]>(() => {
        return filter.items.map(
            filter => {
                if (filter.operator === 'equals') {
                    return Query.equal(filter.field, filter.value);
                }
                if (filter.operator === 'contains' && filter.value) {
                    return Query.search(filter.field, filter.value);
                }
                if (filter.operator === 'startsWith') {
                    return Query.startsWith(filter.field, filter.value);
                }
                if (filter.operator === 'endsWith') {
                    return Query.endsWith(filter.field, filter.value);
                }
                if (filter.operator === 'is' && filter.value) {
                    return Query.equal(filter.field, filter.value === 'true');
                }
                if (filter.operator === 'after' && filter.value) {
                    return Query.greaterThan(filter.field, filter.value);
                }
                if (filter.operator === 'before' && filter.value) {
                    return Query.lessThan(filter.field, filter.value);
                }
                return null;
            }
        );
    }, [ filter ]);

    const sorts: string[] = useMemo<string[]>(() => {
        return sort.map(sort => {
            if (sort.sort === 'asc') {
                return Query.orderAsc(sort.field);
            } else {
                return Query.orderDesc(sort.field);
            }
        });
    }, [sort]);

    const loadCollection = async () => {
        setLoading(true);
        const db = getDatabase();

        try {
            const documents = await db.listDocuments(
                database,
                collection,
                [
                    Query.limit(pagination.pageSize),
                    Query.offset(pagination.page * pagination.pageSize),
                    ...filters,
                    ...sorts,
                ]
            );
            setData(documents);
        } catch (err) {
            console.log({err});
            toast.error(err.toString());
        } finally {
            setLoading(false);
        }
    };

    const loadFields = async () => {
        const db = getDatabase();
        setFields(await db.listAttributes(
            database,
            collection,
        ));
    };

    useEffect(() => {
        loadFields();
        loadCollection();
    }, [database, collection, pagination, filters, sorts]);

    const getColumns = (): GridColDef[] => {

        const operators = {
            'string': getGridStringOperators().filter(operator => ['equals', 'contains', 'startsWith', 'endsWith'].indexOf(operator.value) >= 0),
            'boolean': getGridBooleanOperators(),
            'datetime': getGridDateOperators().filter(operator => ['before', 'after'].indexOf(operator.value) >= 0),
        };

        const columns: GridColDef[] = [
            {
                headerName: '$id',
                field: '$id',
                type: 'string',
                width: 200,
                filterOperators: operators['string'],
            },
            {
                headerName: '$createdAt',
                field: '$createdAt',
                type: 'dateTime',
                width: 200,
                valueGetter: (params) => {
                    return new Date(params.value);
                },
                filterOperators: operators['datetime'],
            },
        ];

        fields.attributes.forEach(attribute => {

            if (attribute['array']) return;

            if (attribute['type'] === 'string' || attribute['type'] === 'boolean') {
                columns.push({
                    headerName: attribute['key'],
                    field: attribute['key'],
                    type: attribute['type'],
                    width: 250,
                    editable: true,
                    filterOperators: operators[attribute['type']]
                });
            }
        });

        return columns;
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
            filterMode="server"
            rowCount={data.total}
            onPaginationModelChange={setPagination}
            paginationModel={pagination}
            onFilterModelChange={setFilter}
            filterModel={filter}
            sortingMode="server"
            onSortModelChange={setSort}
            disableRowSelectionOnClick
            />
        );
}
