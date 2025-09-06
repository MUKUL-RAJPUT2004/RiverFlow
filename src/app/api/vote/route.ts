import { answerCollection, db, questionCollection , voteCollection} from "@/models/name";
import { databases, users } from "@/models/server/config";
import { UserPrefs } from "@/store/Auth";
import { NextRequest, NextResponse } from "next/server";
import { AppwriteException, ID, Query } from "node-appwrite";

export async function POST(request: NextRequest){
    try {
        //grab the data
        const { voteStatus, votedById, type, typeId } = await request.json()

        //list documents
        const response = await databases.listDocuments(
            db, voteCollection, [
                Query.equal("type", type),
                Query.equal("typeId", typeId),
                Query.equal("votedById", votedById),
            ]
        )

        if(response.documents.length > 0){
            await databases.deleteDocument(db, voteCollection, response.documents[0].$id)

            // dec the reputation
            const QuestionOrAnswer = await databases.getDocument(
                db,
                type === "question" ? questionCollection : answerCollection,
                typeId
            );
            const authorPrefs = await users.getPrefs<UserPrefs>(QuestionOrAnswer.authorId);
            await users.updatePrefs<UserPrefs>(QuestionOrAnswer.authorId,{
                reputation: response.documents[0].voteStatus === "upvoted" ? Number(authorPrefs.reputation) -1 : Number(authorPrefs.reputation) + 1
            })
        }

        //this means that prev vote does not exist or vote status changed
        if(response.documents[0]?.voteStatus !== voteStatus){
            const doc = await databases.createDocument(db, voteCollection, ID.unique(), {
                type,
                typeId,
                votedById,
                voteStatus
            });
            // inc or dec the reputation
            const QuestionOrAnswer = await databases.getDocument(
                db,
                type === "question" ? questionCollection : answerCollection,
                typeId
            );
            const authorPrefs = await users.getPrefs<UserPrefs>(QuestionOrAnswer.authorId);
            
            //if vote was present
            if(response.documents[0]){
                await users.updatePrefs<UserPrefs>(QuestionOrAnswer.authorId,{
                    reputation: response.documents[0].voteStatus === "upvoted" ? Number(authorPrefs.reputation) -1 : Number(authorPrefs.reputation) + 1
                })
            }
            else{
                await users.updatePrefs<UserPrefs>(QuestionOrAnswer.authorId, {
                    reputation: voteStatus === "upvoted" ? Number(authorPrefs.reputation) + 1 : Number(authorPrefs.reputation) - 1
                })
            }
        }

        const [upvotes, downvotes] = await Promise.all([
            databases.listDocuments(db, voteCollection, [
                Query.equal("type", type),
                Query.equal("typeId", typeId),
                Query.equal("voteStatus", "upvoted"),
                Query.equal("votedById", votedById),
                Query.limit(1),

            ]),
            databases.listDocuments(db, voteCollection, [
                Query.equal("type", type),
                Query.equal("typeId", typeId),
                Query.equal("voteStatus", "downvoted"),
                Query.equal("votedById", votedById),
                Query.limit(1),

            ])
        ])

            return NextResponse.json({
                data: {
                    document: null, voteResult: upvotes.total - downvotes.total
                },
                message: "vote handled"
            },{
                status: 200
            })

        

    } catch (error) {
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
            error: "An unknown error occurred in voting",
        },
        {
            status: 500,
        }
    );
    }
}