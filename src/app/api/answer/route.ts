import { answerCollection, db} from "@/models/name";
import { databases, users } from "@/models/server/config";
import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { UserPrefs } from "@/store/Auth";
import { AppwriteException } from "node-appwrite";

export async function POST(request: NextRequest){
    try {
        const { questionId, answer , authorId} = await request.json();

        const response = await databases.createDocument(db, answerCollection, ID.unique(), {
            content: answer,
            authorId: authorId,
            questionId: questionId,
        })

        //INC AUTHOR REPUTATION
        const prefs = await users.getPrefs<UserPrefs>(authorId)
        await users.updatePrefs(authorId, {
            reputation: Number(prefs.reputation) + 1
        })

        return NextResponse.json(response,{
            status: 201,
        })
        

    } catch (error: any) {
        return NextResponse.json(
            {
                error: error?.message || "Error creating answer",
            },
            {
                status: error?.status || error?.code || 500,
            }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { answerId } = await request.json();
        const answer = await databases.getDocument(db, answerCollection, answerId);
        const response = await databases.deleteDocument(db, answerCollection, answerId);

        //dec the reputation
        const prefs = await users.getPrefs<UserPrefs>(answer.authorId)
        await users.updatePrefs(answer.authorId, {
            reputation: Number(prefs.reputation) - 1
        })

        return NextResponse.json(
            {data: response},
            {status: 200}
        )
        
    } catch (error) {
        // Check if the error is a specific exception from Appwrite
        if (error instanceof AppwriteException) {
            return NextResponse.json(
                {
                    message: error.message, // Use the detailed message from the exception
                },
                {
                    status: error.code, // Use the actual HTTP status code from Appwrite (e.g., 401, 404)
                }
            );
        }
    
        // Check for a standard JavaScript Error as a fallback
        if (error instanceof Error) {
            return NextResponse.json(
                {
                    message: error.message,
                },
                {
                    status: 500, // Default to 500 for generic server errors
                }
            );
        }
    
        // Handle any other case where the thrown value is not an Error object
        return NextResponse.json(
            {
                message: "Error deleting answer",
            },
            {
                status: 500,
            }
        );
    }
}