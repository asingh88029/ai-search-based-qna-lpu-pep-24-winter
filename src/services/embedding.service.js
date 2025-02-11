const EMBEDDINGSModel = require("./../models/embeddings.model")

const CreateNewChunkEntryService = async (text, source, sourceId, chunkNumber)=>{
    try{

        const Chunk = await EMBEDDINGSModel.create({
            text : text,
            source : source,
            source_id : sourceId,
            chunk_no : chunkNumber
        })

        if(Chunk){
            return {
                success : true,
                data : Chunk
            }
        }else{
            throw new Error('Unable to create new Chunk entry in embeddings collection of mongoDB')
        }

    }catch(err){
        console.log(`Error in CreateNewChunkEntryService with err : ${err}`)
        return {
            success : false,
            message : err.message
        }
    }
}

module.exports = {
   CreateNewChunkEntryService
}