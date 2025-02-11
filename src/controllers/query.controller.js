const {GenerateVectorEmbeddingOfTextUtil} = require("./../utils/openai.utils")

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

        console.log(queryVector)

        // fetch top 5 vector from milvus which is relavent to query vector

        // we have to map top 5 vectors with the original text of chunk

        // query + 5 top chunk text to the LLM for the answer generation

        res.status(201).json({
            success : true,
            answer : ""
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