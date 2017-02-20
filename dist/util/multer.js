
import fs from 'fs';
import path from 'path';
import multer from 'multer';

if (!fs.existsSync(path.resolve("./resume_files"))) {
    fs.mkdirSync(path.resolve("./resume_files"));
}
let storage	=	multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.resolve("./resume_files"));
    }
});

let fileFilter = function (req, file, callback) {
                    let ext = path.extname(file.originalname);
                    if(ext !== '.doc' && ext !== '.docx' && ext !== '.pdf') {
                        return callback(new Error('File type is not accepted!'))
                    }
                    callback(null, true)
                };

// max file size 5 MB
let maxFileSize = {
    fileSize: 5*1024*1024
};

let upload = multer({ storage : storage, fileFilter : fileFilter, limits: maxFileSize}).single('resumeFile');

module.exports = upload;