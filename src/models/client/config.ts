import env from "@/app/env";

import { Client, Account, Avatars, Databases, Storage } from 'appwrite';

const client = new Client();

client
    .setEndpoint(env.appwrite.endpoint) // Replace with your Appwrite endpoint
    .setProject(env.appwrite.projectId); // Replace with your project ID

const databases = new Databases(client);
const account = new Account(client);
const avatars = new Avatars(client);
const storage = new Storage(client);


export { client, databases, account, avatars, storage };
