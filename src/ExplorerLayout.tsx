import { MouseEventHandler, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClient, getDatabase } from "./appwrite.tsx";
import { Models } from "node-appwrite";
import { Button } from "@mui/material";
import Explorer from "./Explorer.tsx";

function ObjectButton({ name, $id, onClick, active = false }: { 
    name: string,
    $id: string,
    onClick: MouseEventHandler<HTMLButtonElement>,
    active?: boolean,
 }) {
    return (
        <button onClick={onClick} className={`object-button ${active ? 'active' : ''}`}>
            <span>{ $id }</span>
            { name }
        </button>
    );
}

export default function ExplorerLayout() {

    const navigate = useNavigate();
    const [databases, setDatabases] = useState<Models.DatabaseList>({ total: 0, databases: [] });
    const [collections, setCollections] = useState<Models.CollectionList>({ total: 0, collections: [] });

    const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

    const loadDatabases = async () => {
        const db = getDatabase();
        setDatabases(await db.list());
    }

    const loadCollections = async () => {
        if (!selectedDatabase) return;
        const db = getDatabase();
        setCollections({ total: 0, collections: [] });
        setCollections(await db.listCollections(selectedDatabase));
    };

    useEffect(() => {
        if (
            !getClient()
            ) {
            console.log('Token not setup');
            navigate('/setup');
        }

        loadDatabases();

    }, []);

    useEffect(() => {
        loadCollections();
    }, [ selectedDatabase ]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
        }}>
            <nav style={{
                borderRight: '1px solid #eee',
                width: '250px',
                padding: '20px',
                textAlign: 'center',
            }}>
                <h3>Databases</h3>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    marginTop: '20px'
                }}>
                    {
                        databases.databases.map(database => (
                            <ObjectButton
                                key={database.$id}
                                onClick={() => setSelectedDatabase(database.$id)}
                                name={database.name}
                                $id={database.$id}
                                active={selectedDatabase === database.$id}
                                />
                        ))
                    }
                </div>
            </nav>
            <nav style={{
                borderRight: '1px solid #eee',
                width: '250px',
                padding: '20px',
                textAlign: 'center',
            }}>
                <h3>Collections</h3>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    marginTop: '20px'
                }}>
                    {
                        collections.collections.map(collection => (
                            <ObjectButton
                                key={collection.$id}
                                onClick={() => setSelectedCollection(collection.$id)}
                                name={collection.name}
                                $id={collection.$id}
                                active={selectedCollection === collection.$id}
                            />
                        ))
                    }
                </div>
            </nav>
            { selectedDatabase && selectedCollection && (
                <Explorer database={selectedDatabase} collection={selectedCollection} />
            ) }
        </div>
    );
}