const {GenerateVectorEmbeddingOfTextUtil, GenerateAnswerOfQueryUsingOrginalQueryAndRelevantContextUtil} = require("./../utils/openai.utils")
const {SearchTop5ResultFromVectorDBUtil} = require("./../utils/milvus.utils")
const {GetTextOfChunkUsingChunkNoSourceAndSourceId} = require("./../services/embedding.service")
const {GetPDFDetailsUsingItsIdService} = require("./../services/pdf.service")
const {CreateNewQueryService, UpdateTheFollowupQueryService} = require("./../services/queries.service")

const QueryController = async (req, res)=>{
    try{

        const startTime = new Date().getTime()

        // get query, qyeryId
        const {query, queryId} = req.body

        // if we are getting queryId, thats mean query is followup
        // for the followup query, lets retriee the perevious context from the mongoDB

        // convert query into the vector embedding
        const GenerateVectorEmbeddingOfTextUtilResult = await GenerateVectorEmbeddingOfTextUtil(query)
        if(!GenerateVectorEmbeddingOfTextUtilResult.success){
            const err = new Error("Unable to generate vector of the query")
            err.statusCode = 500
            throw err
        }
        const {data : queryVector} = GenerateVectorEmbeddingOfTextUtilResult

        // fetch top 5 vector from milvus which is relavent to query vector
        const  SearchTop5ResultFromVectorDBUtilResult = await SearchTop5ResultFromVectorDBUtil(queryVector)
        if(!SearchTop5ResultFromVectorDBUtilResult.success){
            const err = new Error("Unable to perform vector search")
            throw err
        }
        const {data : vectorOfChunksRelatedToQuery} = SearchTop5ResultFromVectorDBUtilResult

        // relevantChunksText[0] and relevantChunksReferences[0] both will be representing the same chunk
        const relevantChunksText = []
        const relevantChunksReferencesMap = new Map()

        // we have to map top 5 vectors with the original text of chunk
        for(let i =0 ; i < vectorOfChunksRelatedToQuery.length ; i++){
            
            const chunkVectorData = vectorOfChunksRelatedToQuery[i]

            const {key_id} = chunkVectorData 

            const [source, sourceId, chunkNumber] = key_id.split("-")

            // fetch text of chunk using chunkNumber, source, sourceId
            const GetTextOfChunkUsingChunkNoSourceAndSourceIdResult = await GetTextOfChunkUsingChunkNoSourceAndSourceId(chunkNumber, source, sourceId)
            if(!GetTextOfChunkUsingChunkNoSourceAndSourceIdResult.success){
                console.log(`Unable to retrive text of chunk for source ${source}, sourceId ${sourceId} and chunkNumber ${chunkNumber}`)
                continue
            }
            const {data : text} = GetTextOfChunkUsingChunkNoSourceAndSourceIdResult

            // fetch the reference of the chunk, using the source and sourceId
            if(source==="pdf"){
                const GetPDFDetailsUsingItsIdServiceResult = await GetPDFDetailsUsingItsIdService(sourceId)
                if(!GetPDFDetailsUsingItsIdServiceResult.success){
                    console.log(`Unable to retrieve the reference of the chunkNo : ${chunkNumber}, source : ${source} and sourceId : ${sourceId}`)
                }
                const {data : {name, url}} = GetPDFDetailsUsingItsIdServiceResult
                if(!relevantChunksReferencesMap.has(sourceId)){
                    relevantChunksReferencesMap.set(sourceId, {source : "pdf", sourceId : sourceId, name : name, url : url})
                }
            } 

            relevantChunksText.push(text)

        }

        // query + 5 top chunk text to the LLM for the answer generation
        const GenerateAnswerOfQueryUsingOrginalQueryAndRelevantContextUtilResult = await GenerateAnswerOfQueryUsingOrginalQueryAndRelevantContextUtil(query, relevantChunksText)
        if(!GenerateAnswerOfQueryUsingOrginalQueryAndRelevantContextUtilResult.success){
            throw new Error("Unable to generate the answer for the query")
        }
        const {data : queryAnswer} = GenerateAnswerOfQueryUsingOrginalQueryAndRelevantContextUtilResult

        const references = []
        for(const [key, value] of relevantChunksReferencesMap.entries()){
            references.push(value)
        }

        const endTime = new Date().getTime()

        const processingTime = endTime - startTime

        const askedAt = new Date(startTime)

        let queryIdFromDb 

        // we have to update the information in mongoDB
        // for the new query, we will create a new entry in mongoDB
        if(!queryId){
            const CreateNewQueryServiceResult = await CreateNewQueryService(query, queryAnswer, processingTime, askedAt)
            if(!CreateNewQueryServiceResult.success){
                throw new Error('Unable to create query in database')
            }
            const {data : {_id}} = CreateNewQueryServiceResult
            queryIdFromDb = _id
        }
        // for the followup query, we will update the existing query info in mongoDB

        res.status(201).json({
            success : true,
            data : {
                queryId : queryIdFromDb,
                answer : queryAnswer,
                references :references
            }
        })

    }catch(err){
        console.log(`Error in QueryController with err : ${err}`)
        res.status(err.statusCode ? err.statusCode : 500).json({
            success : false,
            message : err.message
        })
    }
}

module.exports = {
    QueryController
}