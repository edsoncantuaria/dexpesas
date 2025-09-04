// backend/src/controllers/storageController.js
import minioClient from '../config/minioClient.js';
import config from '../config/config.js';
import crypto from 'crypto';

class StorageController {
    /**
     * Faz o upload de um arquivo para o MinIO e retorna o nome do objeto.
     */
    async uploadFile(req, res, next) {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
        }

        const userId = req.user.id;
        const bucketName = config.minio.bucketName;
        
        if (!bucketName) {
             return res.status(500).json({ message: 'MINIO_BUCKET_NAME não está configurado.' });
        }
        
        try {
            const bucketExists = await minioClient.bucketExists(bucketName);
            if (!bucketExists) {
                await minioClient.makeBucket(bucketName, 'us-east-1');
                console.log(`Bucket ${bucketName} criado.`);
            }
            
            const fileExtension = req.file.originalname.split('.').pop();
            const objectName = `${userId}/${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;

            await minioClient.putObject(bucketName, objectName, req.file.buffer, req.file.size);

            res.status(201).json({ 
                message: 'Arquivo enviado com sucesso!', 
                objectName: objectName // Retorna apenas o caminho do objeto
            });

        } catch (error) {
            console.error('Erro no upload do MinIO:', error);
            next(error);
        }
    }

    /**
     * Gera uma URL pré-assinada para um objeto no MinIO.
     */
    async getPresignedUrl(req, res, next) {
        const { objectName } = req.body;
        const bucketName = config.minio.bucketName;

        if (!objectName || !bucketName) {
            return res.status(400).json({ message: 'Nome do objeto e do bucket são obrigatórios.' });
        }
        
        try {
            // Gera a URL com validade de 15 minutos (900 segundos)
            const url = await minioClient.presignedGetObject(bucketName, objectName, 15 * 60);
            res.json({ url });
        } catch (error) {
            console.error('Erro ao gerar URL pré-assinada:', error);
            res.status(404).json({ message: 'Arquivo não encontrado ou erro de permissão.' });
        }
    }
}

export default new StorageController();
