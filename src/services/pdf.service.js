const PDFSModel = require("./../models/pdfs.model")

const CreateNewPDFEntryService = async (name, author, organizationId, size, pageCount)=>{
    try{

        const PDF = await PDFSModel.create({
            name : name,
            author : author,
            organization : organizationId,
            size : size,
            page_count : pageCount
        })

        if(PDF){
            return {
                success : true,
                data : PDF
            }
        }else{
            throw new Error('Unable to create new PDF entry in pdfs collection of mongoDB')
        }

    }catch(err){
        console.log(`Error in CreateNewPDFEntryService with err : ${err}`)
        return {
            success : false,
            message : err.message
        }
    }
}

const UpdateTheIndexedInfoOfPDFService = async (pdfId)=>{
    try{

        const result = await PDFSModel.findByIdAndUpdate(pdfId, {is_indexed : true,  indexed_at : Date()}).exec()

        console.log(result)

        if(!result){
            throw new Error(`Unable to update the indexing info of pdf with pdfId : ${pdfId}`)
        }

        return {
            success : true
        }

    }catch(err){
        console.log(`Error in UpdateTheIndexedInfoOfPDFService with err : ${err}`)
        return {
            success : false,
            message : err.message
        }
    }
}

const CheckPdfDuplicacyService = async (name, size, organizationId)=>{
    try{

        const result = await PDFSModel.findOne({name : name, size : size, organization : organizationId}).exec() 
        
        if(!result){
            throw new Error(`Unable to check duplicacy of the pdf`)
        }

        return {
            success : true
        }

    }catch(err){
        console.log(`Error in CheckPdfDuplicacyService with err : ${err}`)
        return {
            success : false,
            message : err.message
        }
    }
} 

module.exports = {
    CreateNewPDFEntryService,
    UpdateTheIndexedInfoOfPDFService,
    CheckPdfDuplicacyService
}