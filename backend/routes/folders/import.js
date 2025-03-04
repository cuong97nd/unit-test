const express = require('express');
const router = express.Router();
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const defineFolder = require('../../models/folders');
const defineCase = require('../../models/cases');
const { DataTypes } = require('sequelize');

// Cấu hình multer để lưu file tạm thời
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

module.exports = function (sequelize) {
    const { verifySignedIn } = require('../../middleware/auth')(sequelize);
    const { verifyProjectDeveloperFromProjectId } = require('../../middleware/verifyEditable')(sequelize);
    const Folder = defineFolder(sequelize, DataTypes);
    const Case = defineCase(sequelize, DataTypes);

    router.post('/import', verifySignedIn, verifyProjectDeveloperFromProjectId, upload.single('zipFile'), async (req, res) => {
        const projectId = req.query.projectId;
        if (!projectId) {
            return res.status(400).json({ error: 'projectId is required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            const zip = new AdmZip(req.file.path);
            const results = [];

            // Xử lý từng file trong zip
            for (const zipEntry of zip.getEntries()) {
                if (zipEntry.entryName.endsWith('.csv')) {
                    const folderName = path.parse(zipEntry.entryName).name;

                    // Tạo folder
                    const folder = await Folder.create({
                        name: folderName,
                        detail: `Imported from ${zipEntry.entryName}`,
                        projectId: projectId
                    });

                    // Đọc nội dung CSV
                    const csvContent = zipEntry.getData().toString('utf8');
                    const cases = [];

                    await new Promise((resolve, reject) => {
                        const stream = csvParser({ columns: true });
                        stream.on('data', (data) => {
                            // Thêm các trường mặc định cho case
                            cases.push({
                                title: data.Title || '',
                                state: 1, // Mặc định là trạng thái mới
                                priority: 2, // Mặc định là medium
                                type: 0, // Mặc định là other
                                automationStatus: 1, // Mặc định là manual
                                description: data.Description || '',
                                template: 0, // Mặc định là không phải template
                                preConditions: data.Preconditions || '',
                                expectedResults: data['Expected result'] || '',
                                folderId: folder.id
                            });
                        });
                        stream.on('end', resolve);
                        stream.on('error', reject);
                        stream.write(csvContent);
                        stream.end();
                    });

                    // Tạo các case
                    const createdCases = await Case.bulkCreate(cases);
                    results.push({
                        folder: folderName,
                        casesCount: createdCases.length
                    });
                }
            }

            // Xóa file zip tạm thời
            fs.unlinkSync(req.file.path);

            res.json({
                message: 'Import completed successfully',
                results: results
            });

        } catch (error) {
            console.error('Import error:', error);
            // Xóa file zip tạm thời nếu có lỗi
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: 'Failed to import data' });
        }
    });

    return router;
}; 