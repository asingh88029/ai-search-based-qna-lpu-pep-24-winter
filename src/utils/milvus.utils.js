const {MilvusClient} = require("@zilliz/milvus2-sdk-node")
require("dotenv")

const NODE_ENV = process.env.NODE_ENV

const MILVUS_ENDPOINT = process.env[`${NODE_ENV}_MILVUS_ENDPOINT`]
const MILVUS_AUTH_KEY = process.env[`${NODE_ENV}_MILVUS_AUTH_KEY`]

const StoreVectorEmbeddingOfChunkInMilvusVectorDBUtil = async (vector, keyId, accountId)=>{
    try{

        const Client = new MilvusClient({
            address : MILVUS_ENDPOINT,
            token : MILVUS_AUTH_KEY,
            timeout: 60000,
        })

        const milvusResponse = await Client.insert({
            collection_name : "text_embeddings",
            data : [{
                vector_embedding : vector,
                key_id : keyId,
                account_id : accountId
            }]
        })

        if(milvusResponse.insert_cnt!="1"){
            throw new Error(`Unable to save the Vector Embedding inside the Milvus`)
        }

        return {
            success : true
        }


    }catch(err){
        console.log(err)
        console.log(`Error in StoreVectorEmbeddingOfChunkInMilvusVectorDBUtil with err : ${err}`)
        return {
            success : false,
            message : err.message
        }
    }
}

module.exports = {
    StoreVectorEmbeddingOfChunkInMilvusVectorDBUtil
}

