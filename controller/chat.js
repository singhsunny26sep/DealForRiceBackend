const Media = require("../model/Media");
const { uploadToCloudinary } = require("../service/uploadImage");


exports.uploadImageChat = async (req, res) => {
    // console.log(" ======================= uploadImageChat ======================");
    // console.log("req.body: ", req.body);
    // console.log("req.files: ", req.files);

    const type = req.body?.type
    const image = req.files.image
    const userId = req.payload._id
    try {
        if (!image) {
            return res.status(400).json({ success: false, msg: "Image is required!" });
        }
        const chatMedia = new Media({ type: type, userId: userId })

        let imageUrl = await uploadToCloudinary(image.tempFilePath)
        chatMedia.url = imageUrl

        const result = await chatMedia.save()
        if (result) {
            return res.status(200).json({ success: true, msg: "Image uploaded successfully", imageUrl: result.url, result });
        }
        return res.status(400).json({ success: false, msg: "Failed to upload image!" });
    } catch (error) {
        console.error("Error on uploadImageChat: ", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error", error: error.message });
    }
}