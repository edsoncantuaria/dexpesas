
// backend/scripts/generate-schema.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper para obter o caminho relativo ao script atual, tornando-o mais robusto.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../prisma/models.json');
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

// === Função helper para formatar atributos de campo ===
function formatAttributes(attrs) {
  if (!attrs || attrs.length === 0) return '';
  return ' ' + attrs.join(' ');
}

// === Função principal de geração ===
function generateSchema() {
  try {
    console.log(`Lendo definições de ${jsonPath}...`);
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);

    let schema = `// ATENÇÃO: Este arquivo é gerado automaticamente.
// NÃO EDITE ESTE ARQUIVO DIRETAMENTE.
// Edite o arquivo "models.json" e execute o script de geração.

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}

generator client {
  provider = "prisma-client-js"
}
\n`;

    // Gerar Enums
    if (data.enums) {
      for (const [enumName, values] of Object.entries(data.enums)) {
        schema += `enum ${enumName} {\n`;
        values.forEach(v => {
          schema += `  ${v}\n`;
        });
        schema += `}\n\n`;
      }
    }

    // Gerar Models
    if (data.models) {
      for (const [modelName, modelDef] of Object.entries(data.models)) {
        schema += `model ${modelName} {\n`;

        // Campos
        if (modelDef.fields) {
          for (const [fieldName, fieldDef] of Object.entries(modelDef.fields)) {
            const optional = fieldDef.optional ? '?' : '';
            const attrs = formatAttributes(fieldDef.attributes);
            const comment = fieldDef.comment ? `/// ${fieldDef.comment}\n` : '';
            schema += `  ${comment ? `${comment}  ` : ''}${fieldName.padEnd(20)} ${fieldDef.type}${optional}${attrs}\n`;
          }
        }

        // Relações
        if (modelDef.relations) {
          schema += '\n  // --- Relações ---\n'
          for (const [relName, relDef] of Object.entries(modelDef.relations)) {
            const listFlag = relDef.isList ? '[]' : '';
            const optFlag = relDef.optional ? '?' : '';
            let relationAttribute = '';

            if (relDef.relation) {
              const { name, fields, references, onDelete, onUpdate } = relDef.relation;
              const relAttrs = [
                name ? `"${name}"` : '',
                fields ? `fields: [${fields.join(', ')}]` : '',
                references ? `references: [${references.join(', ')}]` : '',
                onDelete ? `onDelete: ${onDelete}` : '',
                onUpdate ? `onUpdate: ${onUpdate}` : ''
              ].filter(Boolean).join(', ');
              relationAttribute = ` @relation(${relAttrs})`;
            }
            schema += `  ${relName.padEnd(20)} ${relDef.type}${listFlag}${optFlag}${relationAttribute}\n`;
          }
        }
        
        schema += '\n'

        // Índices e IDs compostos
        if (modelDef.indices) {
            modelDef.indices.forEach(idx => {
                let directive;
                if (idx.isId) {
                    directive = '@@id';
                } else if (idx.unique) {
                    directive = '@@unique';
                } else {
                    directive = '@@index';
                }

                const fieldsDef = idx.fields.join(', ');
                const typeDef = idx.type ? `, type: ${idx.type}`: ''; // Para text search etc.
                schema += `  ${directive}([${fieldsDef}]${typeDef})\n`;
            });
        }
        
         // Bloco Map (para renomear tabela no DB)
        if (modelDef.map) {
             schema += `  @@map("${modelDef.map}")\n`;
        }


        schema += `}\n\n`;
      }
    }

    // Escrever no arquivo schema.prisma
    fs.writeFileSync(schemaPath, schema.trim() + '\n', 'utf-8');
    console.log(`✅ schema.prisma gerado com sucesso em ${schemaPath}`);

  } catch (error) {
    console.error('❌ Erro ao gerar o schema.prisma:', error.message);
    if (error instanceof SyntaxError) {
        console.error('O erro parece ser um JSON inválido. Verifique o arquivo models.json.');
    }
    process.exit(1); // Encerra o processo com erro
  }
}

// Executar a função
generateSchema();

    
