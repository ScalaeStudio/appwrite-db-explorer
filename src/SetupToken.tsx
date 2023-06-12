import { Button, Card, TextField } from "@mui/material";
import { toast } from "react-hot-toast";
import { getDatabase } from "./appwrite";
import { useNavigate } from "react-router-dom";

export default function SetupToken() {

    const navigate = useNavigate();

    const testConnection = async (): Promise<void> => {
        const db = getDatabase();
        await db.list();
    }

    const validate = () => {
        const host = (document.querySelector("#host") as HTMLInputElement).value;
        const project = (document.querySelector("#project") as HTMLInputElement).value;
        const token = (document.querySelector("#token") as HTMLInputElement).value;
        console.log({ host, project, token });

        if (!host || !project || !token) {
            return toast.error('All fields should be filled');
        }

        localStorage.setItem("appwriteHost", host);
        localStorage.setItem("appwriteProject", project);
        localStorage.setItem("appwriteToken", token);

        toast.promise(testConnection(), {
            loading: 'Testing the connection',
            success: 'Connected!',
            error: 'Cannot connect',
        })
        .then(() => {
            navigate('/');
        })
        .catch(() => {
            localStorage.clear();
        });
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignContent: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            flexWrap: 'wrap',
        }}>
            <Card
                variant="outlined"
                sx={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    width: '400px',
                }}>
                <h2>Setup Appwrite connection</h2>
                <TextField label="Appwrite host" variant="outlined" id="host" fullWidth />
                <TextField label="Project ID" variant="outlined" id="project" fullWidth />
                <TextField label="API Token" variant="outlined" id="token" fullWidth type='password' />
                <Button onClick={validate} variant="contained">Save</Button>
            </Card>
        </div>
    );
}