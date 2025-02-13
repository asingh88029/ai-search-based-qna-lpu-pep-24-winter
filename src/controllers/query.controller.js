const {GenerateVectorEmbeddingOfTextUtil, GenerateAnswerOfQueryUsingOrginalQueryAndRelevantContextUtil} = require("./../utils/openai.utils")
const {SearchTop5ResultFromVectorDBUtil} = require("./../utils/milvus.utils")
const {GetTextOfChunkUsingChunkNoSourceAndSourceId} = require("./../services/embedding.service")

const QueryController = async (req, res)=>{
    try{

        // get query
        const {query} = req.body

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

        const relevantChunksText = []

        // we have to map top 5 vectors with the original text of chunk
        for(let i =0 ; i < vectorOfChunksRelatedToQuery.length ; i++){
            
            const chunkVectorData = vectorOfChunksRelatedToQuery[i]

            const {key_id} = chunkVectorData 

            const [source, sourceId, chunkNumber] = key_id.split("-")

            const GetTextOfChunkUsingChunkNoSourceAndSourceIdResult = await GetTextOfChunkUsingChunkNoSourceAndSourceId(chunkNumber, source, sourceId)
            if(!GetTextOfChunkUsingChunkNoSourceAndSourceIdResult.success){
                console.log(`Unable to retrive text of chunk for source ${source}, sourceId ${sourceId} and chunkNumber ${chunkNumber}`)
                continue
            }
            const {data : text} = GetTextOfChunkUsingChunkNoSourceAndSourceIdResult

            relevantChunksText.push(text)

        }

        // query + 5 top chunk text to the LLM for the answer generation
        const GenerateAnswerOfQueryUsingOrginalQueryAndRelevantContextUtilResult = await GenerateAnswerOfQueryUsingOrginalQueryAndRelevantContextUtil(query, relevantChunksText)
        if(!GenerateAnswerOfQueryUsingOrginalQueryAndRelevantContextUtilResult.success){
            throw new Error("Unable to generate the answer for the query")
        }
        const {data} = GenerateAnswerOfQueryUsingOrginalQueryAndRelevantContextUtilResult

        res.status(201).json({
            success : true,
            data : data
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