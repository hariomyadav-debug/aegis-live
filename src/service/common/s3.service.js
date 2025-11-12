const { S3Client , PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const client = new S3Client({
    region:process.env.S3_REGION ,
    credentials:{
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    } 
})

async function uploadFileToS3(file) {
    try {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME, // Use the bucket name from environment variables or function parameter
            Key: file.originalname, // Use the original file name
            ContentType: file.mimetype // Set the content type
        };

        const command = new PutObjectCommand(params);

        const response = await getSignedUrl(client,command)
        return response; // Return the response from S3
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw error; // Rethrow the error for further handling
    }
}

module.exports ={
    uploadFileToS3
}