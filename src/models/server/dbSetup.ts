import { db } from "../name";
import createAnswerCollection from "./answer.collection";
import createCommentCollection from "./comment.collection";
import createQuestionCollection from "./question.collection";
import createVoteCollection from "./vote.collection";

import { databases } from "./config";

export default async function getOrCreateDb(){
  try {
    await databases.get(db);    //get whole database
    console.log("Database connected successfully");
    
  } catch (error) {
    try {
      await databases.create(
            db,   //dataBAseId: String
            db    //name of that database: String
          );
      console.log("Database created successfully");

      await Promise.all([
        createQuestionCollection(),
        createAnswerCollection(),
        createCommentCollection(),
        createVoteCollection(),
      ]);
      console.log("All collections created successfully");
      console.log("Database connected successfully");
      
    } catch (error) {
      console.log("Error creating databases or collections:", error);
      
    }
  }
  return databases;
}