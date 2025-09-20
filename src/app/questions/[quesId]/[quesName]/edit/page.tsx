import { db, questionCollection } from "@/models/name";
import { databases } from "@/models/server/config";
import React from "react";
import EditQues from "./EditQues";

// CORRECTED: params is a plain object, not a Promise
const Page = async ({ params }: { params: { quesId: string; quesName: string } }) => {
    // CORRECTED: Access quesId directly, no await needed
    const { quesId } = params;
    const question = await databases.getDocument(db, questionCollection, quesId);

    return <EditQues question={question} />;
};

export default Page;