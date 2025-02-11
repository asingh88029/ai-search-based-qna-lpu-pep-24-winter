const fs = require('fs')
const {ConvertPDFToTextUtil} = require("./../utils/pdf.utils")
const {GenerateVectorEmbeddingOfTextUtil} = require("./../utils/openai.utils")
const {CreateNewPDFEntryService, UpdateTheIndexedInfoOfPDFService, CheckPdfDuplicacyService} = require("./../services/pdf.service")
const {FetchOrganizationIdUsingTheUserIdService} = require("./../services/user.service")
const {CreateNewChunkEntryService} = require("./../services/embedding.service")
const {StoreVectorEmbeddingOfChunkInMilvusVectorDBUtil} = require("./../utils/milvus.utils")

const ConvertLargeTextToChunks = (largeText, chunkSize=400)=>{

    // largeText is of 2000 words
    
    const wordArray = largeText.trim().split(" ")
    const wordArrayLength = wordArray.length // 2000

    const chunks = []

    for(let i=0; i < wordArrayLength/chunkSize; i++){ // i = 0 -> i <= 5
        const startIndex = i*chunkSize
        const endIndex = startIndex + chunkSize

        const chunk = wordArray.slice(startIndex, endIndex).join(" ")

        chunks.push(chunk)
    }

    return chunks

}

const IndexNewPDFController = async (req, res)=>{
    try{

        const source = "pdf"

        // get the pdf
        const {originalname : pdfName,  path : pdfPath, size : pdfSize} = req.file

        const userId = req.userId

        // using the userId of the user, lets fetch the organizationId
        const  FetchOrganizationIdUsingTheUserIdServiceResult = await FetchOrganizationIdUsingTheUserIdService(userId)
        if(!FetchOrganizationIdUsingTheUserIdServiceResult.success){
            const err = new Error("Error while fetching organizationId")
            err.statusCode = 500
            throw err
        }
        const {data : organizationId} = FetchOrganizationIdUsingTheUserIdServiceResult

        // check for duplicate pdf indexing. pdfName + pdfSize combination should be different
        const CheckPdfDuplicacyServiceResult = await CheckPdfDuplicacyService(pdfName, pdfSize, organizationId)
        if(CheckPdfDuplicacyServiceResult.success){
            // delete the pdf form the uploads/pdfs folder
            fs.unlinkSync(pdfPath)
            const err = new Error("PDF is already indexed")
            err.statusCode = 500
            throw err
        }

        // convert pdf to text
        const pdfConvertResult = await ConvertPDFToTextUtil(pdfPath)
        if(!pdfConvertResult.success){
            const err = new Error("Error while converting PDF to Text")
            err.statusCode = 500
            throw err
        }
        const {numpages : numOfPagesInPdf, info : {Title : pdfTitle, Author : pdfAuthor}, text : pdfText} = pdfConvertResult.data

        // we have to store pdf meta info like name, page_no, owner etc in mongoDB
        const CreateNewPDFEntryServiceResult = await CreateNewPDFEntryService(pdfName, pdfAuthor, organizationId, pdfSize, numOfPagesInPdf)
        if(!CreateNewPDFEntryServiceResult.success){
            const err = new Error("Unable to create entry for pdf in pdfs collection of mongoDB")
            err.statusCode = 500
            throw err
        }
        const {data :{_id : sourceId}} = CreateNewPDFEntryServiceResult

        // convert pdfText to small small chunk. small small chunk will combinely known as chunks i.e. Array of Chunk
        const chunks = ConvertLargeTextToChunks(pdfText)

        chunks.forEach(async (chunk, index)=>{

            // For each chunk iterate
            
            const chunkNo = index + 1
            
            // create vector embedding using emebedding model of the individual chunk
            const GenerateVectorEmbeddingOfTextUtilResult = await GenerateVectorEmbeddingOfTextUtil(chunk)
            if(!GenerateVectorEmbeddingOfTextUtilResult.success){
                console.log(`Error while generating vector embedding of chunk with chunkNo ${chunkNo} for pdf with name : ${pdfName} and organizationId : ${organizationId}`)
                return
            }
            const {data : vectorEmbedding} = GenerateVectorEmbeddingOfTextUtilResult

            // store the chunk in plain text into the mongoDB
            const CreateNewChunkEntryServiceResult = await CreateNewChunkEntryService(chunk, source, sourceId, chunkNo)
            if(!CreateNewChunkEntryServiceResult.success){
                console.log(`Error while creating chunk entry of chunk with chunkNo ${chunkNo} in embeddings collection of mongoDB  for pdf with name : ${pdfName} and organizationId : ${organizationId}`)
                return
            }
            const {data : {_id}} = CreateNewChunkEntryServiceResult

            // store the vector embedding of chunk in vector db i.e Milvus
            const StoreVectorEmbeddingOfChunkInMilvusVectorDBUtilResult = await StoreVectorEmbeddingOfChunkInMilvusVectorDBUtil(vectorEmbedding, `${source}-${sourceId}-${chunkNo}`, organizationId)
            if(!StoreVectorEmbeddingOfChunkInMilvusVectorDBUtilResult.success){
                console.log(`Error while saving vector embedding of chunk with chunkNo ${chunkNo} in milvus vector database for pdf with name : ${pdfName} and organizationId : ${organizationId}`)
            }
            
        })

        // update the pdf is_indexed and indexed_at value in mongoDB
        const UpdateTheIndexedInfoOfPDFServiceResult = await UpdateTheIndexedInfoOfPDFService(sourceId)
        if(!UpdateTheIndexedInfoOfPDFServiceResult.success){
            console.log("Error while updating indexed info of pdf in mongoDB")
        }

        // upload the pdf to the file static storage services like cloudinary or aws s3

        // delete the pdf form the uploads/pdfs folder
        fs.unlinkSync(pdfPath)

        console.log(`PDF with name ${pdfName} is indexed successfully!`)

        res.status(201).json({
            success : true,
            message : "PDF is indexed"
        })

    }catch(err){
        console.log(`Error in IndexNewPDFController with error : ${err}`)
        res.status(err.statusCode ? err.statusCode : 500).json({
            success : false,
            message : err.message
        })
    }
}

module.exports = {
    IndexNewPDFController
}