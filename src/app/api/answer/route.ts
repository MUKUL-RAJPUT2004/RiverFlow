import { answerCollection, db} from "@/models/name";
import { databases, users } from "@/models/server/config";
import { NextRequest, NextResponse } from "next/server";
import { AppwriteException, ID } from "node-appwrite";
import { UserPrefs } from "@/store/Auth";
import error from "next/error";
import { stat } from "fs";

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
        

    } catch (error) {
            // 2. Check for a specific AppwriteException first

        if (error instanceof AppwriteException) {
            return NextResponse.json(
                {
                    error: error.message, // Use the message from the exception
                },
                {
                    status: error.code, // Appwrite exceptions use `code` for the HTTP status
                }
            );
        }

        // 3. Check for a generic Error as a fallback
    if (error instanceof Error) {
        return NextResponse.json(
            {
                error: error.message,
            },
            {
                status: 500, // Generic errors get a default 500 status
            }
        );
    }

    // 4. Handle any other unknown cases
    return NextResponse.json(
        {
            error: "An unknown error occurred",
        },
        {
            status: 500,
        }
    );
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
        
    } catch (error: any) {
        return NextResponse.json(
            {
                message: error?.message || "Error deleting answer",
            },
            {
                status: error?.status || error?.code || 500,
            }
        )
    }
}