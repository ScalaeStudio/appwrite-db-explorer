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
    GridRenderCellParams,
} from '@mui/x-data-grid';
import { Models, Query } from "node-appwrite";
import toast from "react-hot-toast";
import { Button, Drawer, IconButton } from "@mui/material";
import { ArrowDownward, ArrowUpward, Delete, AddCircle } from "@mui/icons-material";
import RelationshipPreview from "./RelationshipPreview";

type Attributes =
    Models.AttributeBoolean
    | Models.AttributeDatetime
    | Models.AttributeEmail
    | Models.AttributeEnum
    | Models.AttributeFloat
    | Models.AttributeInteger
    | Models.AttributeIp
    | Models.AttributeRelationship
    | Models.AttributeString
    | Models.AttributeUrl;

export default function Explorer({
    database, collection, navigateToDocument, selectedDocument = null,
}: { 
    database: string,
    collection: string,
    navigateToDocument: (collection: string, documentId: string) => void,
    selectedDocument?: string,
}) {

    const [data, setData] = useState<Models.DocumentList<Models.Document>>({ total: 0, documents: [] });
    const [fields, setFields] = useState<Models.AttributeList>({ total: 0, attributes: [] });
    const [loading, setLoading] = useState<boolean>(false);
    const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 100, });
    const [filter, setFilter] = useState<GridFilterModel>({ items: [], });
    const [sort, setSort] = useState<GridSortModel>([]);
    const [highlightedArray, setHighlightedArray] = useState<Array<any> | null>(null);
    const [highlightedArrayField, setHighlightedArrayField] = useState<Attributes | null>(null);
    const [highlightedArrayDocument, setHighlightedArrayDocument] = useState<string | null>(null);

    const filters: string[] = useMemo<string[]>(() => {
        return filter.items.map(
            filter => {
                if (filter.operator === 'equals' && filter.value) {
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

    const getHighlightedArrayField = (field: string): Attributes => {
        // @ts-expect-error
        return fields.attributes.find(
            attr => attr['key'] === field
        ) as Attributes;
    }

    useEffect(() => {
        loadFields();
        loadCollection();
    }, [database, collection, pagination, filters, sorts]);

    useEffect(() => {
        if (!selectedDocument) return;
        setHighlightedArray(null);
        setTimeout(() => {
            setFilter({ items: [...filter.items, {
                field: '$id',
                operator: 'equals',
                value: selectedDocument,
            }] });
        }, 1000);
    }, [selectedDocument]);

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

            if (attribute['type'] === 'relationship' && attribute['relationType'].endsWith('ToMany')) {
                attribute['array'] = true;
            }

            if (attribute['array']) {
                columns.push({
                    headerName: attribute['key'],
                    field: attribute['key'],
                    renderCell: (params) => {
                        if (!params.value) return "...";
                        return <Button
                            onClick={() => {
                                setHighlightedArray(params.value);
                                setHighlightedArrayField(getHighlightedArrayField(params.field));
                                setHighlightedArrayDocument(params.row.$id);
                            }}
                            variant="text">
                                Array of {params.value.length}
                            </Button>;
                    },
                    width: 150,
                    filterOperators: [],
                    hideSortIcons: true,
                });
                return;
            };

            if (attribute['type'] === 'string' || attribute['type'] === 'boolean') {
                columns.push({
                    headerName: attribute['key'],
                    field: attribute['key'],
                    type: attribute['type'],
                    width: 250,
                    editable: true,
                    filterOperators: operators[attribute['type']],
                });
            }

            if (attribute['type'] === 'relationship') {
                columns.push({
                    headerName: attribute['key'],
                    field: attribute['key'],
                    width: 200,
                    filterOperators: [],
                    hideSortIcons: true,
                    renderCell: (params) => {
                        if (!params.value) return "...";
                        return <RelationshipPreview
                                    navigateToDocument={navigateToDocument}
                                    document={params.value} />;
                    },
                });
            }
        });

        return columns;
    }

    const moveArrayItem = async (fromIndex: number, toIndex: number) => {
        const db = getDatabase();
        const newArray = [...highlightedArray];
        newArray.splice(toIndex, 0, newArray.splice(fromIndex, 1)[0]);

        const update = {};
        update[highlightedArrayField.key] = newArray;
        toast.promise(db.updateDocument(
            database,
            collection,
            highlightedArrayDocument,
            update,
        ), {
            loading: 'Updating array',
            success: 'Array updated',
            error: (err) => `Cannot update array: ${err}`,
        })
        .then(() => setHighlightedArray(newArray));
    }

    const createArrayItem = async () => {
        const item = prompt('Add a new item');
        if (!item) return;

        const newArray = [...highlightedArray];
        newArray.push(item);

        const db = getDatabase();
        const update = {};
        update[highlightedArrayField.key] = newArray;
        toast.promise(db.updateDocument(
            database,
            collection,
            highlightedArrayDocument,
            update,
        ), {
            loading: 'Updating array',
            success: () => {
                setHighlightedArray(newArray);
                return 'Array updated';
            },
            error: (err) => `Cannot update array: ${err}`,
        })
    }

    const deleteArrayItem = async (index: number) => {
        const confirmation = confirm('⚠️ You\'re about to delete one array item');
        if (!confirmation) return;

        const newArray = [...highlightedArray];
        newArray.splice(index, 1);

        const db = getDatabase();
        const update = {};
        update[highlightedArrayField.key] = newArray;
        toast.promise(db.updateDocument(
            database,
            collection,
            highlightedArrayDocument,
            update,
        ), {
            loading: 'Updating array',
            success: () => {
                setHighlightedArray(newArray);
                return 'Array updated';
            },
            error: (err) => `Cannot update array: ${err}`,
        })
    }

    const getArrayColumns = (): GridColDef[] => {
        if (!highlightedArray || !highlightedArrayField) return [];

        const renderCell = highlightedArrayField.type === 'relationship' ? (params: GridRenderCellParams) => {
            return <RelationshipPreview document={params.value} navigateToDocument={navigateToDocument} />;
        } : null;

        return [
            {
                headerName: 'ID',
                field: 'index',
                width: 100,
                type: 'number',
            },
            {
                headerName: highlightedArrayField.key,
                field: 'value',
                type: highlightedArrayField.type,
                width: 400,
                renderCell,
                editable: true,
            },
            {
                headerName: '',
                field: 'action',
                width: 150,
                renderCell: (params: GridRenderCellParams) => {
                    return (
                        <>
                            <IconButton
                                onClick={() => deleteArrayItem(params.row.index)}
                                aria-label="delete">
                                <Delete />
                            </IconButton>
                            <IconButton
                                aria-label="up"
                                onClick={() => {
                                    moveArrayItem(params.row.index, params.row.index - 1);
                                }}
                                disabled={params.row.index === 0}>
                                <ArrowUpward />
                            </IconButton>
                            <IconButton
                                aria-label="down"
                                onClick={() => {
                                    moveArrayItem(params.row.index, params.row.index + 1);
                                }}
                                disabled={params.row.index === highlightedArray?.length - 1}>
                                <ArrowDownward />
                            </IconButton>
                        </>
                    );
                },
            }
        ];
    }

    const editRow = (newRow: Models.Document, oldRow: Models.Document) => {
        return new Promise<Models.Document>(resolve => {

            let change: string | null = null;
            fields.attributes.forEach(attr => {
                if (oldRow[attr['key']] !== newRow[attr['key']]) {
                    change = attr['key'];
                }
            });
            if (!change) return resolve(oldRow);

            const result = confirm("⚠️ You're about to edit one cell. Are you sure?");
            if (!result) return resolve(oldRow);
            const db = getDatabase();
            const update = {};
            update[change] = newRow[change];
            toast.promise(db.updateDocument(
                database,
                collection,
                newRow.$id,
                update,
            ), {
                loading: 'Editing document...',
                success: 'Successfully edited the document',
                error: (err) => `Cannot edit the document: ${err}`
            })
            .then(() => resolve(newRow))
            .catch(() => resolve(oldRow));
        });
    }

    return (
        <>
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
                processRowUpdate={editRow}
                disableRowSelectionOnClick
                />

            <Drawer
                anchor='right'
                open={highlightedArray !== null}
                onClose={() => setHighlightedArray(null)}
                >
                    {highlightedArray && highlightedArrayField && (
                        <>
                        <div>
                            <IconButton>
                                <AddCircle onClick={() => createArrayItem()} />
                            </IconButton>
                        </div>
                        <DataGrid
                            columns={getArrayColumns()}
                            rows={highlightedArray?.map((value, index) => ({ value, index }))}
                            getRowId={(row) => row.index}
                            disableRowSelectionOnClick
                            />
                        </>
                    )}
            </Drawer>
        </>
        );
}
