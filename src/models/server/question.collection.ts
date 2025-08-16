import {IndexType, Permission} from "node-appwrite";

import {db, questionCollection} from "../name"
import { databases } from "./config";

export default async function createQuestionCollection() {
    //create collection
    await databases.createCollection(db, questionCollection, questionCollection,[
        Permission.read("any"),
        Permission.read("users"),
        Permission.create("users"),
        Permission.update("users"),
        Permission.delete("users"),
    ])
    console.log("Question collection created successfully");
    

    //create attributes
    await Promise.all([
        databases.createStringAttribute(db, questionCollection, "title", 100, true),
        databases.createStringAttribute(db, questionCollection, "content", 10000, true),
        databases.createStringAttribute(db, questionCollection, "authorId", 50, true),
        databases.createStringAttribute(db, questionCollection, "tags", 50, true, undefined, true),
        databases.createStringAttribute(db, questionCollection, "attachemntId", 50, false)
    ]);
    console.log("Question Attributes created");


    //create Indexes
    await Promise.all([
        /*
        databases.createIndex(
            db,
            questionCollection,
            "title",
            IndexType.Fulltext,
            ["title"],
            ['asc']
        ),
                created manually coz it couldn't be created by code, but its there
        */
        databases.createIndex(
            db,
            questionCollection,
            "content",
            IndexType.Fulltext,
            ["content"],
            ['asc']
        ),
    ])
    

}
