const axios = require("axios")
require('dotenv').config()

const NODE_ENV = process.env.NODE_ENV

const OPENAI_KEY = process.env[`${NODE_ENV}_OPENAI_KEY`]

const EMBEDDING_MODEL = process.env[`${NODE_ENV}_EMBEDDING_MODEL`]

const GenerateVectorEmbeddingOfTextUtil = async (text)=>{
    try{

        const OPENAI_EMBEDDING_MODEL_API_URL = "https://api.openai.com/v1/embeddings"

        const data = {
            model : EMBEDDING_MODEL,
            input : text
        }

        const config = {
            headers : {
                'Authorization' : `Bearer ${OPENAI_KEY}`,
                'Content-Type' : 'application/json'
            }
        }

        const apiResult = await axios.post(OPENAI_EMBEDDING_MODEL_API_URL, data, config)

        if(!apiResult.data || !apiResult.data.data || apiResult.data.data.length ==0){
            throw new Error('Error while generating embedding')
        }

        return {
            success : true,
            data : apiResult.data.data[0].embedding
        }

    }catch(err){
        console.log(`Error in GenerateVectorEmbeddingOfTextUtil with err : ${err}`)
        return {
            success : false,
            message : err.message
        }
    }
}

module.exports = {
    GenerateVectorEmbeddingOfTextUtil
}