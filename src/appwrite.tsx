import { Client, Databases } from 'node-appwrite';

export const getClient = (): Client | null => {
    if (
        !localStorage.getItem('appwriteToken')
        || !localStorage.getItem('appwriteProject')
        || !localStorage.getItem('appwriteHost')
        ) {
            return null;
        }
    return new Client()
            .setEndpoint(localStorage.getItem('appwriteHost'))
            .setProject(localStorage.getItem('appwriteProject'))
            .setKey(localStorage.getItem('appwriteToken'));
}

export const getDatabase = (): Databases => {
    const client = getClient();
    if (!client) throw Error('Cannot instantite client');
    return new Databases(client);
}
