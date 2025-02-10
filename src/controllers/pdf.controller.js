const fs = require('fs')
const {ConvertPDFToTextUtil} = require("./../utils/pdf.utils")
const {GenerateVectorEmbeddingOfTextUtil} = require("./../utils/openai.utils")

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

        // get the pdf
        const {originalname : pdfName,  path : pdfPath, size : pdfSize} = req.file

        // convert pdf to text
        const pdfConvertResult = await ConvertPDFToTextUtil(pdfPath)
        if(!pdfConvertResult.success){
            const err = new Error("Error while converting PDF to Text")
            err.statusCode = 500
            throw err
        }
        const {numpages : numOfPagesInPdf, info : {Title : pdfTitle, Author : pdfAuthor}, text : pdfText} = pdfConvertResult.data


        // convert pdfText to small small chunk. small small chunk will combinely known as chunks i.e. Array of Chunk
        const chunks = ConvertLargeTextToChunks(pdfText)
        chunks.forEach(async (chunk, index)=>{
            // For each chunk iterate
            
            // create vector embedding using emebedding model of the individual chunk
            const GenerateVectorEmbeddingOfTextUtilResult = await GenerateVectorEmbeddingOfTextUtil(chunk)
            if(!GenerateVectorEmbeddingOfTextUtilResult.success){
                return
            }
            const {data : embedding} = GenerateVectorEmbeddingOfTextUtilResult

            // store the vector emebdiing in vector db i.e Milvus
            
            // store the chunk in plain text into the mongoDB
        })
        
        // we have to store pdf meta info like name, page_no, owner etc in mongoDB

        // upload the pdf to the file static storage services like cloudinary or aws s3

        // delete the pdf form the uploads/pdfs folder
        fs.unlinkSync(pdfPath)

        res.status(201).json({
            success : true,
            message : "PDF is indexed"
        })

    }catch(err){
        console.log(`Error in IndexNewPDFController with error : ${err}`)
        res.status(err.statusCode ? err.statusCode : 500).json({
            success : true,
            message : err.message
        })
    }
}

module.exports = {
    IndexNewPDFController
}