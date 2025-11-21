/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.13-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: dexpesas
-- ------------------------------------------------------
-- Server version	10.11.13-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Account`
--

DROP TABLE IF EXISTS `Account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Account` (
  `id` varchar(191) NOT NULL,
  `nome` varchar(191) NOT NULL,
  `instituicao` varchar(191) NOT NULL,
  `bankCode` varchar(191) DEFAULT NULL,
  `agencyNumber` varchar(191) DEFAULT NULL,
  `agencyDigit` varchar(191) DEFAULT NULL,
  `accountNumber` varchar(191) DEFAULT NULL,
  `accountDigit` varchar(191) DEFAULT NULL,
  `tipo` enum('corrente','poupanca','investimento') NOT NULL,
  `currency` enum('BRL','USD') NOT NULL DEFAULT 'BRL',
  `saldoInicial` decimal(18,4) NOT NULL,
  `color` varchar(191) DEFAULT NULL,
  `icone` varchar(191) DEFAULT NULL,
  `isArchived` tinyint(1) NOT NULL DEFAULT 0,
  `userId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Account`
--

LOCK TABLES `Account` WRITE;
/*!40000 ALTER TABLE `Account` DISABLE KEYS */;
INSERT INTO `Account` VALUES
('cmi7f7ob00007zr401izjwx58','Nubank','Nubank',NULL,NULL,NULL,NULL,NULL,'corrente','BRL',1046.6000,NULL,NULL,0,'cmi7b69q20000zrs7cvqaxass'),
('cmi7wl0fh000ezrmq7v6vh2gq','Gabi','Nubank ',NULL,NULL,NULL,NULL,NULL,'corrente','BRL',5000.0000,NULL,NULL,0,'cmi7wk3g10006zrmqkcx8fzac'),
('cmi854ddt0008zrm1660pswx7','Nubank','Nubank',NULL,NULL,NULL,NULL,NULL,'corrente','BRL',100.0000,NULL,NULL,0,'cmi853w170000zrm1zzvlkdn3');
/*!40000 ALTER TABLE `Account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Achievement`
--

DROP TABLE IF EXISTS `Achievement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Achievement` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `icon` longtext NOT NULL,
  `xp` int(11) NOT NULL,
  `criteria` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`criteria`)),
  `trigger` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Achievement`
--

LOCK TABLES `Achievement` WRITE;
/*!40000 ALTER TABLE `Achievement` DISABLE KEYS */;
INSERT INTO `Achievement` VALUES
('cmi8qyfsd0000zr834iolkb3o','Primeiros Passos','Crie sua conta e faça o primeiro login.','Footprints',10,'\"{\\\"count\\\":1}\"','LOGIN'),
('cmi8qyfsg0001zr83vgx07drf','Organizado','Crie sua primeira categoria de despesas.','FolderPlus',15,'\"{\\\"count\\\":1}\"','CATEGORY_CREATED'),
('cmi8qyfsi0002zr8376tfvxra','Poupador Iniciante','Registre sua primeira receita.','PiggyBank',20,'\"{\\\"type\\\":\\\"receita\\\",\\\"count\\\":1}\"','TRANSACTION_CREATED'),
('cmi8qyfsk0003zr83h8wc3rs0','Gastador Consciente','Registre sua primeira despesa.','Receipt',20,'\"{\\\"type\\\":\\\"despesa\\\",\\\"count\\\":1}\"','TRANSACTION_CREATED'),
('cmi8qyfsn0004zr83qgzz3s0k','Planejador','Defina um orçamento para uma categoria.','Target',25,'\"{\\\"count\\\":1}\"','BUDGET_CREATED'),
('cmi8qyfsp0005zr83p3ik6oh1','Explorador','Acesse todas as abas do dashboard.','Compass',30,'\"{\\\"tabs\\\":\\\"all\\\"}\"','NAVIGATION'),
('cmi8qyfsr0006zr83h1iw6twn','Mestre das Categorias','Crie 5 categorias diferentes.','Layers',40,'\"{\\\"count\\\":5}\"','CATEGORY_CREATED'),
('cmi8qyfst0007zr83niw9edu3','Fluxo Constante','Registre receitas por 3 meses seguidos.','TrendingUp',50,'\"{\\\"type\\\":\\\"income\\\",\\\"months\\\":3}\"','STREAK'),
('cmi8qyfsv0008zr834s46tak3','Guardião do Orçamento','Não estoure nenhum orçamento por 1 mês.','ShieldCheck',60,'\"{\\\"duration\\\":\\\"1 month\\\"}\"','BUDGET_ADHERENCE'),
('cmi8qyfsx0009zr83rbjr6wel','Investidor Aprendiz','Crie uma meta de investimento.','Sprout',45,'\"{\\\"type\\\":\\\"investment\\\"}\"','GOAL_CREATED'),
('cmi8qyfsz000azr83k25x8mew','Focado','Complete 5 missões semanais.','Crosshair',55,'\"{\\\"count\\\":5}\"','MISSION_COMPLETED'),
('cmi8qyft1000bzr836e12mydl','Socialite','Adicione um amigo ou membro da família.','Users',40,'\"{\\\"count\\\":1}\"','FRIEND_ADDED'),
('cmi8qyft4000czr83qubx5jbt','Generoso','Faça uma doação registrada.','Heart',50,'\"{\\\"category\\\":\\\"Doacao\\\"}\"','TRANSACTION_CREATED'),
('cmi8qyft7000dzr83o0vejtzp','Leitor Voraz','Gaste em Livros ou Educação 3 vezes.','BookOpen',45,'\"{\\\"category\\\":\\\"Educacao\\\",\\\"count\\\":3}\"','TRANSACTION_CREATED'),
('cmi8qyfta000ezr83yzpaqf3n','Saúde de Ferro','Invista em Saúde ou Esporte 5 vezes.','Dumbbell',50,'\"{\\\"category\\\":\\\"Saude\\\",\\\"count\\\":5}\"','TRANSACTION_CREATED'),
('cmi8qyftd000fzr83nzum01s2','Viajante','Crie uma meta de viagem.','Plane',60,'\"{\\\"category\\\":\\\"Viagem\\\"}\"','GOAL_CREATED'),
('cmi8qyftg000gzr836bnubqri','Magnata','Acumule R$ 10.000 em patrimônio.','Crown',100,'\"{\\\"amount\\\":10000}\"','NET_WORTH'),
('cmi8qyftj000hzr83ycmz1yau','Oráculo Financeiro','Mantenha o orçamento verde por 6 meses.','Eye',90,'\"{\\\"months\\\":6}\"','BUDGET_STREAK'),
('cmi8qyftm000izr83fw28ndf3','Lenda da Disciplina','Complete 50 missões diárias.','Star',85,'\"{\\\"count\\\":50,\\\"type\\\":\\\"daily\\\"}\"','MISSION_COMPLETED'),
('cmi8qyfto000jzr837w81z0xc','Mestre dos Investimentos','Complete 3 metas de investimento.','Briefcase',95,'\"{\\\"count\\\":3,\\\"type\\\":\\\"investment\\\"}\"','GOAL_COMPLETED'),
('cmi8qyftq000kzr83t18dalpr','Guru da Sabedoria','Atinja 80+ em Sabedoria.','Scroll',100,'\"{\\\"attribute\\\":\\\"Sabedoria\\\",\\\"level\\\":80}\"','ATTRIBUTE_LEVEL'),
('cmi8qyfts000lzr83tywx4cq6','Titã da Força','Atinja 80+ em Força.','Swords',100,'\"{\\\"attribute\\\":\\\"Forca\\\",\\\"level\\\":80}\"','ATTRIBUTE_LEVEL'),
('cmi8qyftu000mzr83mi15dxg3','Muralha da Resistência','Atinja 80+ em Resistência.','Shield',100,'\"{\\\"attribute\\\":\\\"Resistencia\\\",\\\"level\\\":80}\"','ATTRIBUTE_LEVEL'),
('cmi8qyftw000nzr831a864obu','Filho da Sorte','Atinja 80+ em Sorte.','Clover',100,'\"{\\\"attribute\\\":\\\"Sorte\\\",\\\"level\\\":80}\"','ATTRIBUTE_LEVEL'),
('cmi8qyftz000ozr83omjgy5hy','Café Lover','Registre 10 gastos com \"Café\" ou \"Padaria\".','Coffee',30,'\"{\\\"keywords\\\":[\\\"cafe\\\",\\\"padaria\\\"],\\\"count\\\":10}\"','TRANSACTION_KEYWORD'),
('cmi8qyfu1000pzr83vy1uneom','Pizza Night','Gaste com Pizza numa sexta-feira.','Pizza',25,'\"{\\\"keyword\\\":\\\"pizza\\\",\\\"day\\\":\\\"Friday\\\"}\"','TRANSACTION_TIME'),
('cmi8qyfu4000qzr83a93qu2yf','Tech Enthusiast','Compre um item de tecnologia caro.','Smartphone',70,'\"{\\\"category\\\":\\\"Eletronicos\\\",\\\"minAmount\\\":1000}\"','TRANSACTION_VALUE'),
('cmi8qyfu6000rzr83asa0gl2s','Gamer','Gaste com jogos ou consoles.','Gamepad',40,'\"{\\\"category\\\":\\\"Jogos\\\"}\"','TRANSACTION_CATEGORY'),
('cmi8qyfu9000szr83tv3ysxaz','Pet Lover','Gaste com seu animal de estimação.','Dog',35,'\"{\\\"category\\\":\\\"Pets\\\"}\"','TRANSACTION_CATEGORY'),
('cmi8qyfub000tzr83s9ts84zd','Cinema','Registre um gasto com cinema.','Film',20,'\"{\\\"keyword\\\":\\\"cinema\\\"}\"','TRANSACTION_KEYWORD'),
('cmi8qyfud000uzr83bbxtxqk2','Músico','Gaste com instrumentos ou shows.','Music',50,'\"{\\\"category\\\":\\\"Musica\\\"}\"','TRANSACTION_CATEGORY'),
('cmi8qyfuf000vzr83vs81868v','Chef de Cozinha','Gaste mais de R$ 500 em mercado no mês.','Utensils',45,'\"{\\\"category\\\":\\\"Mercado\\\",\\\"minAmount\\\":500}\"','MONTHLY_SPENDING'),
('cmi8qyfuh000wzr83xdkdt6km','Fitness','Pague a mensalidade da academia.','Activity',30,'\"{\\\"keyword\\\":\\\"academia\\\"}\"','TRANSACTION_KEYWORD'),
('cmi8qyfuj000xzr83rzi04ij0','Zen','Gaste com meditação, yoga ou terapia.','Flower',40,'\"{\\\"keywords\\\":[\\\"yoga\\\",\\\"terapia\\\",\\\"meditacao\\\"]}\"','TRANSACTION_KEYWORD'),
('cmi8qyful000yzr83tqs5034l','Rei do Camarote','Gaste mais de R$ 200 em uma saída noturna.','PartyPopper',35,'\"{\\\"category\\\":\\\"Lazer\\\",\\\"minAmount\\\":200}\"','TRANSACTION_VALUE'),
('cmi8qyfun000zzr83w406om97','Mão de Vaca','Passe 3 dias sem registrar gastos.','Lock',50,'\"{\\\"days\\\":3}\"','NO_SPEND_STREAK'),
('cmi8qyfup0010zr83qcvacai3','Colecionador','Tenha 10 itens no inventário (se existisse).','Package',40,'\"{\\\"count\\\":10}\"','INVENTORY_COUNT'),
('cmi8qyfur0011zr83yqeet0ez','Veterano','Use o app por 1 ano.','Medal',100,'\"{\\\"days\\\":365}\"','ACCOUNT_AGE');
/*!40000 ALTER TABLE `Achievement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `AiAnalysis`
--

DROP TABLE IF EXISTS `AiAnalysis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `AiAnalysis` (
  `id` varchar(191) NOT NULL,
  `type` enum('HABIT_ANALYSIS','OPPORTUNITY_ANALYSIS') NOT NULL,
  `analysisText` text NOT NULL,
  `relevantTransactionIds` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AiAnalysis`
--

LOCK TABLES `AiAnalysis` WRITE;
/*!40000 ALTER TABLE `AiAnalysis` DISABLE KEYS */;
/*!40000 ALTER TABLE `AiAnalysis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Attachment`
--

DROP TABLE IF EXISTS `Attachment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Attachment` (
  `id` varchar(191) NOT NULL,
  `url` varchar(191) NOT NULL,
  `mimeType` varchar(191) DEFAULT NULL,
  `size` int(11) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `uploadedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  `transactionId` varchar(191) DEFAULT NULL,
  `billOccurrenceId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Attachment`
--

LOCK TABLES `Attachment` WRITE;
/*!40000 ALTER TABLE `Attachment` DISABLE KEYS */;
/*!40000 ALTER TABLE `Attachment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `AuditLog`
--

DROP TABLE IF EXISTS `AuditLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `AuditLog` (
  `id` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `entity` varchar(191) NOT NULL,
  `entityId` varchar(191) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`details`)),
  `status` enum('SUCCESS','FAILURE') NOT NULL DEFAULT 'SUCCESS',
  `origin` varchar(191) NOT NULL DEFAULT 'WEB_APP',
  `ipAddress` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AuditLog`
--

LOCK TABLES `AuditLog` WRITE;
/*!40000 ALTER TABLE `AuditLog` DISABLE KEYS */;
INSERT INTO `AuditLog` VALUES
('cmi7f7obc0003zrg3ionxl8w5','CREATE_ACCOUNT','ACCOUNT','cmi7f7ob00007zr401izjwx58','{\"after\":{\"id\":\"cmi7f7ob00007zr401izjwx58\",\"nome\":\"Nubank\",\"instituicao\":\"Nubank\",\"bankCode\":null,\"agencyNumber\":null,\"agencyDigit\":null,\"accountNumber\":null,\"accountDigit\":null,\"tipo\":\"corrente\",\"currency\":\"BRL\",\"saldoInicial\":\"0\",\"color\":null,\"icone\":null,\"isArchived\":false,\"userId\":\"cmi7b69q20000zrs7cvqaxass\"}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 12:41:47.734','cmi7b69q20000zrs7cvqaxass'),
('cmi7f82gm0005zrg3cuqbk50b','GAMIFICATION_EVENT','GAMIFICATION_EVENT','BUDGET_CREATED','{\"eventType\":\"BUDGET_CREATED\",\"xpAwarded\":10,\"description\":\"Criou um novo orçamento.\",\"meta\":{}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 12:42:06.070','cmi7b69q20000zrs7cvqaxass'),
('cmi7f82hl0001zr3zn9n388a3','LEVEL_UP','USER','cmi7b69q20000zrs7cvqaxass','{\"oldLevel\":1,\"newLevel\":2}','SUCCESS','UNKNOWN',NULL,'2025-11-20 12:42:06.103','cmi7b69q20000zrs7cvqaxass'),
('cmi7f82hn0007zrg31wct9f1r','CREATE_BUDGET','BUDGET','cmi7f82fz0009zr40itwqplyd','{\"after\":{\"id\":\"cmi7f82fz0009zr40itwqplyd\",\"month\":\"2025-11\",\"limit\":\"1200\",\"rollover\":false,\"type\":\"MONTHLY\",\"startDate\":null,\"endDate\":null,\"currency\":\"BRL\",\"includeTransfers\":false,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"categoryId\":\"cat_casa\",\"accountId\":null,\"cellBudgetId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 12:42:06.107','cmi7b69q20000zrs7cvqaxass'),
('cmi7f8csn0009zrg3gpy8c853','DELETE_BUDGET','BUDGET','cmi7f82fz0009zr40itwqplyd','{\"before\":{\"id\":\"cmi7f82fz0009zr40itwqplyd\",\"month\":\"2025-11\",\"limit\":\"1200\",\"rollover\":false,\"type\":\"MONTHLY\",\"startDate\":null,\"endDate\":null,\"currency\":\"BRL\",\"includeTransfers\":false,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"categoryId\":\"cat_casa\",\"accountId\":null,\"cellBudgetId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 12:42:19.463','cmi7b69q20000zrs7cvqaxass'),
('cmi7ggbc10003zr3z12a79cgy','GAMIFICATION_EVENT','GAMIFICATION_EVENT','TRANSACTION_CREATED','{\"eventType\":\"TRANSACTION_CREATED\",\"xpAwarded\":1,\"description\":\"Registrou uma nova transação.\",\"meta\":{\"amount\":\"1\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 13:16:30.432','cmi7b69q20000zrs7cvqaxass'),
('cmi7ggbca000bzrg3pcy35dw3','CREATE_TRANSACTION','TRANSACTION','cmi7ggbbh000hzr40r2to8vml','{\"after\":{\"id\":\"cmi7ggbbh000hzr40r2to8vml\",\"valor\":\"1\",\"descricao\":\"Nubank\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:16:21.790Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null},\"entryType\":\"single\"}','SUCCESS','WEB_APP','::ffff:127.0.0.1','2025-11-20 13:16:30.442','cmi7b69q20000zrs7cvqaxass'),
('cmi7ggeku0005zr3zv6r5e2lc','GAMIFICATION_EVENT','GAMIFICATION_EVENT','BILL_UNPAID','{\"eventType\":\"BILL_UNPAID\",\"xpAwarded\":-10,\"description\":\"Desmarcou um pagamento.\",\"meta\":{\"amount\":\"1\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 13:16:34.639','cmi7b69q20000zrs7cvqaxass'),
('cmi7ggel40007zr3za4b2kxod','TOGGLE_PAID_STATUS','TRANSACTION','cmi7ggbbh000hzr40r2to8vml','{\"before\":{\"id\":\"cmi7ggbbh000hzr40r2to8vml\",\"valor\":\"1\",\"descricao\":\"Nubank\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:16:21.790Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null},\"after\":{\"id\":\"cmi7ggbbh000hzr40r2to8vml\",\"valor\":\"1\",\"descricao\":\"Nubank\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:16:21.790Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":false,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 13:16:34.648','cmi7b69q20000zrs7cvqaxass'),
('cmi7ggfu3000dzrg3mwu2zhsd','GAMIFICATION_EVENT','GAMIFICATION_EVENT','BILL_PAID','{\"eventType\":\"BILL_PAID\",\"xpAwarded\":1,\"description\":\"Pagou uma fatura.\",\"meta\":{\"amount\":\"1\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 13:16:36.267','cmi7b69q20000zrs7cvqaxass'),
('cmi7ggfu6000fzrg3b3r2f7sw','TOGGLE_PAID_STATUS','TRANSACTION','cmi7ggbbh000hzr40r2to8vml','{\"before\":{\"id\":\"cmi7ggbbh000hzr40r2to8vml\",\"valor\":\"1\",\"descricao\":\"Nubank\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:16:21.790Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":false,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null},\"after\":{\"id\":\"cmi7ggbbh000hzr40r2to8vml\",\"valor\":\"1\",\"descricao\":\"Nubank\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:16:21.790Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 13:16:36.269','cmi7b69q20000zrs7cvqaxass'),
('cmi7hdw9i0001zr90a0ivnnny','GAMIFICATION_EVENT','GAMIFICATION_EVENT','TRANSACTION_CREATED','{\"eventType\":\"TRANSACTION_CREATED\",\"xpAwarded\":1,\"description\":\"Registrou uma nova transação.\",\"meta\":{\"amount\":\"0.01\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 13:42:37.206','cmi7b69q20000zrs7cvqaxass'),
('cmi7hdw9k000bzrqsanful5dm','CREATE_TRANSACTION','TRANSACTION','cmi7hdw8q0001zr91jtewhjrt','{\"after\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null},\"entryType\":\"single\"}','SUCCESS','WEB_APP','::ffff:127.0.0.1','2025-11-20 13:42:37.208','cmi7b69q20000zrs7cvqaxass'),
('cmi7hnau80005zr7fvk3x082c','UPDATE_TRANSACTION','TRANSACTION','cmi7hdw8q0001zr91jtewhjrt','{\"before\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null,\"tags\":[]},\"after\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 13:49:56.000','cmi7b69q20000zrs7cvqaxass'),
('cmi7hnidw0001zr79cfsyum2e','UPDATE_TRANSACTION','TRANSACTION','cmi7hdw8q0001zr91jtewhjrt','{\"before\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null,\"tags\":[]},\"after\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 13:50:05.780','cmi7b69q20000zrs7cvqaxass'),
('cmi7hzkcg0001zrzj63zvy6g7','GAMIFICATION_EVENT','GAMIFICATION_EVENT','BILL_UNPAID','{\"eventType\":\"BILL_UNPAID\",\"xpAwarded\":-10,\"description\":\"Desmarcou um pagamento.\",\"meta\":{\"amount\":\"0.01\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 13:59:28.190','cmi7b69q20000zrs7cvqaxass'),
('cmi7hzkcn0009zr7f164psn1m','TOGGLE_PAID_STATUS','TRANSACTION','cmi7hdw8q0001zr91jtewhjrt','{\"before\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null},\"after\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":false,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 13:59:28.197','cmi7b69q20000zrs7cvqaxass'),
('cmi7hzl9r0003zrzjksi08af5','GAMIFICATION_EVENT','GAMIFICATION_EVENT','BILL_PAID','{\"eventType\":\"BILL_PAID\",\"xpAwarded\":1,\"description\":\"Pagou uma fatura.\",\"meta\":{\"amount\":\"0.01\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 13:59:29.391','cmi7b69q20000zrs7cvqaxass'),
('cmi7hzl9u000bzr7ftdwxb4qi','TOGGLE_PAID_STATUS','TRANSACTION','cmi7hdw8q0001zr91jtewhjrt','{\"before\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":false,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null},\"after\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 13:59:29.394','cmi7b69q20000zrs7cvqaxass'),
('cmi7hzniq0005zrzjci5lycuc','GAMIFICATION_EVENT','GAMIFICATION_EVENT','BILL_UNPAID','{\"eventType\":\"BILL_UNPAID\",\"xpAwarded\":-10,\"description\":\"Desmarcou um pagamento.\",\"meta\":{\"amount\":\"0.01\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 13:59:32.306','cmi7b69q20000zrs7cvqaxass'),
('cmi7hznir000dzr7f70i15nb6','TOGGLE_PAID_STATUS','TRANSACTION','cmi7hdw8q0001zr91jtewhjrt','{\"before\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null},\"after\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":false,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 13:59:32.307','cmi7b69q20000zrs7cvqaxass'),
('cmi7hzqto0007zrzjaklhjeos','GAMIFICATION_EVENT','GAMIFICATION_EVENT','BILL_PAID','{\"eventType\":\"BILL_PAID\",\"xpAwarded\":1,\"description\":\"Pagou uma fatura.\",\"meta\":{\"amount\":\"0.01\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 13:59:36.588','cmi7b69q20000zrs7cvqaxass'),
('cmi7hzqtr0009zrzjkx5kkm86','TOGGLE_PAID_STATUS','TRANSACTION','cmi7hdw8q0001zr91jtewhjrt','{\"before\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":false,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null},\"after\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 13:59:36.591','cmi7b69q20000zrs7cvqaxass'),
('cmi7mt86m000fzr7f8kkkwcl8','CREATE_CARD','CARD','cmi7mt86d0008zrz7158fao9r','{\"after\":{\"id\":\"cmi7mt86d0008zrz7158fao9r\",\"nome\":\"Nubank\",\"limite\":\"1000\",\"diaFechamento\":1,\"diaVencimento\":10,\"bandeira\":\"mastercard\",\"status\":\"ACTIVE\",\"rewardsType\":\"nenhum\",\"rewardsProgram\":\"\",\"rewardsConversionRate\":\"1\",\"lastFourDigits\":\"5595\",\"issuer\":null,\"billingCurrency\":\"BRL\",\"currencyForConversion\":\"BRL\",\"currentInvoiceAmount\":\"0\",\"availableLimit\":null,\"jurosRotativo\":\"14.9\",\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"paymentAccountId\":\"cmi7f7ob00007zr401izjwx58\"}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 16:14:30.572','cmi7b69q20000zrs7cvqaxass'),
('cmi7tjzcd000bzrzjtwjkst36','UPDATE_ACCOUNT','ACCOUNT','cmi7f7ob00007zr401izjwx58','{\"before\":{\"id\":\"cmi7f7ob00007zr401izjwx58\",\"nome\":\"Nubank\",\"instituicao\":\"Nubank\",\"bankCode\":null,\"agencyNumber\":null,\"agencyDigit\":null,\"accountNumber\":null,\"accountDigit\":null,\"tipo\":\"corrente\",\"currency\":\"BRL\",\"saldoInicial\":\"0\",\"color\":null,\"icone\":null,\"isArchived\":false,\"userId\":\"cmi7b69q20000zrs7cvqaxass\"},\"after\":{\"id\":\"cmi7f7ob00007zr401izjwx58\",\"nome\":\"Nubank\",\"instituicao\":\"Nubank\",\"bankCode\":null,\"agencyNumber\":null,\"agencyDigit\":null,\"accountNumber\":null,\"accountDigit\":null,\"tipo\":\"corrente\",\"currency\":\"BRL\",\"saldoInicial\":\"1046.6\",\"color\":null,\"icone\":null,\"isArchived\":false,\"userId\":\"cmi7b69q20000zrs7cvqaxass\"}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 19:23:16.524','cmi7b69q20000zrs7cvqaxass'),
('cmi7tk6bz000dzrzjod6s4ejm','UPDATE_ACCOUNT','ACCOUNT','cmi7f7ob00007zr401izjwx58','{\"before\":{\"id\":\"cmi7f7ob00007zr401izjwx58\",\"nome\":\"Nubank\",\"instituicao\":\"Nubank\",\"bankCode\":null,\"agencyNumber\":null,\"agencyDigit\":null,\"accountNumber\":null,\"accountDigit\":null,\"tipo\":\"corrente\",\"currency\":\"BRL\",\"saldoInicial\":\"1046.6\",\"color\":null,\"icone\":null,\"isArchived\":false,\"userId\":\"cmi7b69q20000zrs7cvqaxass\"},\"after\":{\"id\":\"cmi7f7ob00007zr401izjwx58\",\"nome\":\"Nubank\",\"instituicao\":\"Nubank\",\"bankCode\":null,\"agencyNumber\":null,\"agencyDigit\":null,\"accountNumber\":null,\"accountDigit\":null,\"tipo\":\"corrente\",\"currency\":\"BRL\",\"saldoInicial\":\"1046.6\",\"color\":null,\"icone\":null,\"isArchived\":false,\"userId\":\"cmi7b69q20000zrs7cvqaxass\"}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 19:23:25.583','cmi7b69q20000zrs7cvqaxass'),
('cmi7tkao6000fzrzjqmv9bi4r','GAMIFICATION_EVENT','GAMIFICATION_EVENT','BILL_UNPAID','{\"eventType\":\"BILL_UNPAID\",\"xpAwarded\":-10,\"description\":\"Desmarcou um pagamento.\",\"meta\":{\"amount\":\"1\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 19:23:31.206','cmi7b69q20000zrs7cvqaxass'),
('cmi7tkaoa000hzr7fhch5vngq','TOGGLE_PAID_STATUS','TRANSACTION','cmi7ggbbh000hzr40r2to8vml','{\"before\":{\"id\":\"cmi7ggbbh000hzr40r2to8vml\",\"valor\":\"1\",\"descricao\":\"Nubank\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:16:21.790Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null},\"after\":{\"id\":\"cmi7ggbbh000hzr40r2to8vml\",\"valor\":\"1\",\"descricao\":\"Nubank\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:16:21.790Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":false,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 19:23:31.208','cmi7b69q20000zrs7cvqaxass'),
('cmi7tkbax000hzrzjr0gwlt78','GAMIFICATION_EVENT','GAMIFICATION_EVENT','BILL_UNPAID','{\"eventType\":\"BILL_UNPAID\",\"xpAwarded\":-10,\"description\":\"Desmarcou um pagamento.\",\"meta\":{\"amount\":\"0.01\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 19:23:32.025','cmi7b69q20000zrs7cvqaxass'),
('cmi7tkbb0000jzr7fj6zgmcmx','TOGGLE_PAID_STATUS','TRANSACTION','cmi7hdw8q0001zr91jtewhjrt','{\"before\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null},\"after\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":false,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 19:23:32.028','cmi7b69q20000zrs7cvqaxass'),
('cmi7tkl41000lzr7fq8ip96iz','DELETE_TRANSACTION','TRANSACTION','cmi7hdw8q0001zr91jtewhjrt','{\"before\":{\"id\":\"cmi7hdw8q0001zr91jtewhjrt\",\"valor\":\"0.01\",\"descricao\":\"teste\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:42:31.625Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":false,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":\"cmi7b69q20000zrs7cvqaxass/7d7abb1cff4f81678fc1cab658df6702.png\",\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 19:23:44.737','cmi7b69q20000zrs7cvqaxass'),
('cmi7tkn20000jzrzjvodlke2p','DELETE_TRANSACTION','TRANSACTION','cmi7ggbbh000hzr40r2to8vml','{\"before\":{\"id\":\"cmi7ggbbh000hzr40r2to8vml\",\"valor\":\"1\",\"descricao\":\"Nubank\",\"tipo\":\"receita\",\"data\":\"2025-11-20T13:16:21.790Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":false,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi7b69q20000zrs7cvqaxass\",\"accountId\":\"cmi7f7ob00007zr401izjwx58\",\"cardId\":null,\"categoryId\":\"cat_outras_receitas\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 19:23:47.256','cmi7b69q20000zrs7cvqaxass'),
('cmi7tl6uv000lzrzjoaemsw06','UPLOAD_STATEMENT','RECONCILIATION','cmi7tl6um000azrz719zgeskk','{\"fileName\":\"NU_741439543_01NOV2025_18NOV2025.ofx\",\"objectName\":\"reconciliations/cmi7b69q20000zrs7cvqaxass/47a440f82752bcce9c26a8360b7ff829.ofx\"}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 19:24:12.919','cmi7b69q20000zrs7cvqaxass'),
('cmi7tlmvk002tzrzjliz23aok','GAMIFICATION_EVENT','GAMIFICATION_EVENT','RECONCILIATION_STREAK','{\"eventType\":\"RECONCILIATION_STREAK\",\"xpAwarded\":40,\"description\":\"Manteve a rotina de reconciliação.\",\"meta\":{\"reconciliationId\":\"cmi7tl6um000azrz719zgeskk\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-20 19:24:33.680','cmi7b69q20000zrs7cvqaxass'),
('cmi7tlmvl005wzr7f7w7c7suz','FINALIZE_RECONCILIATION','RECONCILIATION','cmi7tl6um000azrz719zgeskk','{}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 19:24:33.682','cmi7b69q20000zrs7cvqaxass'),
('cmi7uw99d002vzrzj112fs3ac','CELL_CREATED','CELL','cmi7uw993000ezrz77ommizpx','{\"name\":\"Familia\"}','SUCCESS','UNKNOWN',NULL,'2025-11-20 20:00:48.864','cmi7b69q20000zrs7cvqaxass'),
('cmi7vn9290005zriljrsh07ji','CELL_DELETED','CELL','cmi7uw993000ezrz77ommizpx','{}','SUCCESS','UNKNOWN',NULL,'2025-11-20 20:21:48.320','cmi7b69q20000zrs7cvqaxass'),
('cmi7vnt860007zrilkaxi9p8v','CELL_CREATED','CELL','cmi7vnt7p0001zr9xw9337asz','{\"name\":\"familia\"}','SUCCESS','UNKNOWN',NULL,'2025-11-20 20:22:14.454','cmi7b69q20000zrs7cvqaxass'),
('cmi7wl0fr0007zrmk9vlq8ylm','CREATE_ACCOUNT','ACCOUNT','cmi7wl0fh000ezrmq7v6vh2gq','{\"after\":{\"id\":\"cmi7wl0fh000ezrmq7v6vh2gq\",\"nome\":\"Gabi\",\"instituicao\":\"Nubank \",\"bankCode\":null,\"agencyNumber\":null,\"agencyDigit\":null,\"accountNumber\":null,\"accountDigit\":null,\"tipo\":\"corrente\",\"currency\":\"BRL\",\"saldoInicial\":\"5000\",\"color\":null,\"icone\":null,\"isArchived\":false,\"userId\":\"cmi7wk3g10006zrmqkcx8fzac\"}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-20 20:48:03.446','cmi7wk3g10006zrmqkcx8fzac'),
('cmi854deb0007zrlvh73wcjlb','CREATE_ACCOUNT','ACCOUNT','cmi854ddt0008zrm1660pswx7','{\"after\":{\"id\":\"cmi854ddt0008zrm1660pswx7\",\"nome\":\"Nubank\",\"instituicao\":\"Nubank\",\"bankCode\":null,\"agencyNumber\":null,\"agencyDigit\":null,\"accountNumber\":null,\"accountDigit\":null,\"tipo\":\"corrente\",\"currency\":\"BRL\",\"saldoInicial\":\"100\",\"color\":null,\"icone\":null,\"isArchived\":false,\"userId\":\"cmi853w170000zrm1zzvlkdn3\"}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-21 00:47:03.635','cmi853w170000zrm1zzvlkdn3'),
('cmi855ilt0009zrlvz50ukfyy','GAMIFICATION_EVENT','GAMIFICATION_EVENT','BUDGET_CREATED','{\"eventType\":\"BUDGET_CREATED\",\"xpAwarded\":50,\"description\":\"Criou um novo orçamento.\",\"meta\":{}}','SUCCESS','UNKNOWN',NULL,'2025-11-21 00:47:57.039','cmi853w170000zrm1zzvlkdn3'),
('cmi855imb000bzrlvcao2ryqz','LEVEL_UP','USER','cmi853w170000zrm1zzvlkdn3','{\"oldLevel\":1,\"newLevel\":2}','SUCCESS','UNKNOWN',NULL,'2025-11-21 00:47:57.059','cmi853w170000zrm1zzvlkdn3'),
('cmi855imk000dzrlv4gp6537x','CREATE_BUDGET','BUDGET','cmi855il6000azrm1hf65ilai','{\"after\":{\"id\":\"cmi855il6000azrm1hf65ilai\",\"month\":\"2025-11\",\"limit\":\"50\",\"rollover\":false,\"type\":\"MONTHLY\",\"startDate\":null,\"endDate\":null,\"currency\":\"BRL\",\"includeTransfers\":false,\"userId\":\"cmi853w170000zrm1zzvlkdn3\",\"categoryId\":\"cat_alimentacao\",\"accountId\":null,\"cellBudgetId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-21 00:47:57.068','cmi853w170000zrm1zzvlkdn3'),
('cmi8560xm000fzrlvrb5gn3za','GAMIFICATION_EVENT','GAMIFICATION_EVENT','TRANSACTION_CREATED','{\"eventType\":\"TRANSACTION_CREATED\",\"xpAwarded\":1,\"description\":\"Registrou uma nova transação.\",\"meta\":{\"amount\":\"20\"}}','SUCCESS','UNKNOWN',NULL,'2025-11-21 00:48:20.794','cmi853w170000zrm1zzvlkdn3'),
('cmi8560xx000hzrlvu6h6njet','CREATE_TRANSACTION','TRANSACTION','cmi8560x3000izrm1jpo7x8eq','{\"after\":{\"id\":\"cmi8560x3000izrm1jpo7x8eq\",\"valor\":\"20\",\"descricao\":\"Ifood\",\"tipo\":\"despesa\",\"data\":\"2025-11-21T00:48:07.201Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi853w170000zrm1zzvlkdn3\",\"accountId\":\"cmi854ddt0008zrm1660pswx7\",\"cardId\":null,\"categoryId\":\"cat_bares_restaurantes\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null},\"entryType\":\"single\"}','SUCCESS','WEB_APP','::ffff:127.0.0.1','2025-11-21 00:48:20.805','cmi853w170000zrm1zzvlkdn3'),
('cmi856f8i000jzrlvx94mhok5','UPDATE_TRANSACTION','TRANSACTION','cmi8560x3000izrm1jpo7x8eq','{\"before\":{\"id\":\"cmi8560x3000izrm1jpo7x8eq\",\"valor\":\"20\",\"descricao\":\"Ifood\",\"tipo\":\"despesa\",\"data\":\"2025-11-21T00:48:07.201Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":null,\"withInterest\":false,\"interestRate\":null,\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi853w170000zrm1zzvlkdn3\",\"accountId\":\"cmi854ddt0008zrm1660pswx7\",\"cardId\":null,\"categoryId\":\"cat_bares_restaurantes\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null,\"tags\":[]},\"after\":{\"id\":\"cmi8560x3000izrm1jpo7x8eq\",\"valor\":\"20\",\"descricao\":\"Ifood\",\"tipo\":\"despesa\",\"data\":\"2025-11-21T00:48:07.201Z\",\"metodoPagamento\":\"pix\",\"currency\":\"BRL\",\"status\":\"POSTED\",\"pago\":true,\"notes\":\"\",\"installment\":false,\"installmentId\":null,\"installmentNumber\":null,\"totalInstallments\":2,\"withInterest\":false,\"interestRate\":\"0\",\"valorTotal\":null,\"totalWithInterest\":null,\"balanceAfter\":null,\"recurrenceType\":null,\"recorrenciaId\":null,\"attachmentUrl\":null,\"bankReference\":null,\"authorizationCode\":null,\"merchantName\":null,\"merchantCategory\":null,\"counterparty\":null,\"postedAt\":null,\"clearedAt\":null,\"isTransfer\":false,\"counterAccountId\":null,\"transferGroupId\":null,\"isReconciled\":false,\"isInvoicePayment\":false,\"finalizedGoalId\":null,\"userId\":\"cmi853w170000zrm1zzvlkdn3\",\"accountId\":\"cmi854ddt0008zrm1660pswx7\",\"cardId\":null,\"categoryId\":\"cat_alimentacao\",\"importedTransactionId\":null,\"sharedExpenseParticipantId\":null}}','SUCCESS','UNKNOWN','::ffff:127.0.0.1','2025-11-21 00:48:39.330','cmi853w170000zrm1zzvlkdn3');
/*!40000 ALTER TABLE `AuditLog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Automation`
--

DROP TABLE IF EXISTS `Automation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Automation` (
  `id` varchar(191) NOT NULL,
  `type` enum('ROUND_UP','GOAL_CONTRIBUTION','BILL_PAY') NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 0,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `scheduleType` enum('MANUAL','DAILY','WEEKLY','MONTHLY','THRESHOLD') NOT NULL DEFAULT 'MANUAL',
  `scheduleValue` varchar(191) DEFAULT NULL,
  `lastRun` datetime(3) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `goalId` varchar(191) DEFAULT NULL,
  `recorrenciaId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Automation_goalId_key` (`goalId`),
  UNIQUE KEY `Automation_userId_type_recorrenciaId_key` (`userId`,`type`,`recorrenciaId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Automation`
--

LOCK TABLES `Automation` WRITE;
/*!40000 ALTER TABLE `Automation` DISABLE KEYS */;
INSERT INTO `Automation` VALUES
('cmi7tmt9z000czrz7r5ldwrun','ROUND_UP',0,'{}','MANUAL',NULL,NULL,'cmi7b69q20000zrs7cvqaxass',NULL,NULL),
('cmi7woan0000gzrmqnk58q2kv','ROUND_UP',0,'{}','MANUAL',NULL,NULL,'cmi7wk3g10006zrmqkcx8fzac',NULL,NULL),
('cmi87t7gh0001zrqy94n4qcpu','ROUND_UP',0,'{}','MANUAL',NULL,NULL,'cmi853w170000zrm1zzvlkdn3',NULL,NULL);
/*!40000 ALTER TABLE `Automation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `BillOccurrence`
--

DROP TABLE IF EXISTS `BillOccurrence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `BillOccurrence` (
  `id` varchar(191) NOT NULL,
  `billId` varchar(191) NOT NULL,
  `dueDate` datetime(3) NOT NULL,
  `amount` decimal(18,4) NOT NULL,
  `status` enum('PENDING','PAID','SKIPPED','FAILED') NOT NULL DEFAULT 'PENDING',
  `paidAt` datetime(3) DEFAULT NULL,
  `transactionId` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BillOccurrence`
--

LOCK TABLES `BillOccurrence` WRITE;
/*!40000 ALTER TABLE `BillOccurrence` DISABLE KEYS */;
/*!40000 ALTER TABLE `BillOccurrence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Boss`
--

DROP TABLE IF EXISTS `Boss`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Boss` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `hp` bigint(20) NOT NULL,
  `currentHp` bigint(20) NOT NULL,
  `rewardJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`rewardJson`)),
  `isActive` tinyint(1) NOT NULL DEFAULT 0,
  `startAt` datetime(3) DEFAULT NULL,
  `endAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Boss`
--

LOCK TABLES `Boss` WRITE;
/*!40000 ALTER TABLE `Boss` DISABLE KEYS */;
/*!40000 ALTER TABLE `Boss` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Budget`
--

DROP TABLE IF EXISTS `Budget`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Budget` (
  `id` varchar(191) NOT NULL,
  `month` varchar(191) DEFAULT NULL,
  `limit` decimal(18,4) NOT NULL,
  `rollover` tinyint(1) NOT NULL DEFAULT 0,
  `type` enum('MONTHLY','WEEKLY','CUSTOM') NOT NULL DEFAULT 'MONTHLY',
  `startDate` datetime(3) DEFAULT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `currency` enum('BRL','USD') NOT NULL DEFAULT 'BRL',
  `includeTransfers` tinyint(1) NOT NULL DEFAULT 0,
  `userId` varchar(191) NOT NULL,
  `categoryId` varchar(191) NOT NULL,
  `accountId` varchar(191) DEFAULT NULL,
  `cellBudgetId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Budget_userId_categoryId_type_month_startDate_endDate_cellBu_key` (`userId`,`categoryId`,`type`,`month`,`startDate`,`endDate`,`cellBudgetId`),
  KEY `Budget_userId_startDate_endDate_idx` (`userId`,`startDate`,`endDate`),
  KEY `Budget_userId_month_idx` (`userId`,`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Budget`
--

LOCK TABLES `Budget` WRITE;
/*!40000 ALTER TABLE `Budget` DISABLE KEYS */;
INSERT INTO `Budget` VALUES
('cmi855il6000azrm1hf65ilai','2025-11',50.0000,0,'MONTHLY',NULL,NULL,'BRL',0,'cmi853w170000zrm1zzvlkdn3','cat_alimentacao',NULL,NULL);
/*!40000 ALTER TABLE `Budget` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Card`
--

DROP TABLE IF EXISTS `Card`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Card` (
  `id` varchar(191) NOT NULL,
  `nome` varchar(191) NOT NULL,
  `limite` decimal(18,4) NOT NULL,
  `diaFechamento` int(11) NOT NULL,
  `diaVencimento` int(11) NOT NULL,
  `bandeira` enum('visa','mastercard','elo','amex') NOT NULL,
  `status` enum('ACTIVE','BLOCKED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `rewardsType` varchar(191) DEFAULT NULL,
  `rewardsProgram` varchar(191) DEFAULT NULL,
  `rewardsConversionRate` decimal(10,4) DEFAULT NULL,
  `lastFourDigits` varchar(191) DEFAULT NULL,
  `issuer` varchar(191) DEFAULT NULL,
  `billingCurrency` enum('BRL','USD') NOT NULL DEFAULT 'BRL',
  `currencyForConversion` enum('BRL','USD') DEFAULT 'BRL',
  `currentInvoiceAmount` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `availableLimit` decimal(18,4) DEFAULT NULL,
  `jurosRotativo` decimal(10,4) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `paymentAccountId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Card`
--

LOCK TABLES `Card` WRITE;
/*!40000 ALTER TABLE `Card` DISABLE KEYS */;
INSERT INTO `Card` VALUES
('cmi7mt86d0008zrz7158fao9r','Nubank',1000.0000,1,10,'mastercard','ACTIVE','nenhum','',1.0000,'5595',NULL,'BRL','BRL',0.0000,NULL,14.9000,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58');
/*!40000 ALTER TABLE `Card` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CardInvoice`
--

DROP TABLE IF EXISTS `CardInvoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CardInvoice` (
  `id` varchar(191) NOT NULL,
  `cardId` varchar(191) NOT NULL,
  `referenceMonth` varchar(191) NOT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) NOT NULL,
  `closingDate` datetime(3) NOT NULL,
  `dueDate` datetime(3) NOT NULL,
  `status` enum('OPEN','CLOSED','PAID','OVERDUE') NOT NULL DEFAULT 'OPEN',
  `amountDue` decimal(18,4) NOT NULL,
  `amountPaid` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `minimumPayment` decimal(18,4) DEFAULT NULL,
  `previousBalance` decimal(18,4) DEFAULT NULL,
  `generatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `CardInvoice_cardId_referenceMonth_idx` (`cardId`,`referenceMonth`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CardInvoice`
--

LOCK TABLES `CardInvoice` WRITE;
/*!40000 ALTER TABLE `CardInvoice` DISABLE KEYS */;
/*!40000 ALTER TABLE `CardInvoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CardInvoiceItem`
--

DROP TABLE IF EXISTS `CardInvoiceItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CardInvoiceItem` (
  `id` varchar(191) NOT NULL,
  `invoiceId` varchar(191) NOT NULL,
  `transactionId` varchar(191) DEFAULT NULL,
  `description` varchar(191) NOT NULL,
  `type` enum('receita','despesa') NOT NULL,
  `amount` decimal(18,4) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CardInvoiceItem`
--

LOCK TABLES `CardInvoiceItem` WRITE;
/*!40000 ALTER TABLE `CardInvoiceItem` DISABLE KEYS */;
/*!40000 ALTER TABLE `CardInvoiceItem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CategorizationRule`
--

DROP TABLE IF EXISTS `CategorizationRule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CategorizationRule` (
  `id` varchar(191) NOT NULL,
  `keyword` varchar(191) NOT NULL,
  `conditionType` enum('CONTAINS','EQUALS','STARTS_WITH','ENDS_WITH') NOT NULL DEFAULT 'CONTAINS',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  `categoryId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CategorizationRule`
--

LOCK TABLES `CategorizationRule` WRITE;
/*!40000 ALTER TABLE `CategorizationRule` DISABLE KEYS */;
/*!40000 ALTER TABLE `CategorizationRule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Category`
--

DROP TABLE IF EXISTS `Category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Category` (
  `id` varchar(191) NOT NULL,
  `nome` varchar(191) NOT NULL,
  `label` varchar(191) NOT NULL,
  `icon` varchar(191) DEFAULT NULL,
  `type` enum('receita','despesa') NOT NULL DEFAULT 'despesa',
  `parentCategoryId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_userId_nome_key` (`userId`,`nome`),
  KEY `Category_parentCategoryId_idx` (`parentCategoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Category`
--

LOCK TABLES `Category` WRITE;
/*!40000 ALTER TABLE `Category` DISABLE KEYS */;
INSERT INTO `Category` VALUES
('cat_alimentacao','Alimentacao','Alimentação','Utensils','despesa',NULL,NULL),
('cat_assinaturas_servicos','AssinaturasEServicos','Assinaturas e Serviços','Wallet','despesa',NULL,NULL),
('cat_bares_restaurantes','BaresERestaurantes','Bares e Restaurantes','GlassWater','despesa',NULL,NULL),
('cat_casa','Casa','Casa','Home','despesa',NULL,NULL),
('cat_compras','Compras','Compras','ShoppingCart','despesa',NULL,NULL),
('cat_cuidados_pessoais','CuidadosPessoais','Cuidados Pessoais','Droplets','despesa',NULL,NULL),
('cat_dividas_emprestimos','DividasEEmprestimos','Dívidas e Empréstimos','Landmark','despesa',NULL,NULL),
('cat_educacao','Educacao','Educação','GraduationCap','despesa',NULL,NULL),
('cat_emprestimos_receita','Emprestimos','Empréstimos','Landmark','receita',NULL,NULL),
('cat_familia_filhos','FamiliaEFilhos','Família e Filhos','Users','despesa',NULL,NULL),
('cat_impostos_taxas','ImpostosETaxas','Impostos e Taxas','Landmark','despesa',NULL,NULL),
('cat_investimentos','Investimentos','Investimentos','BarChart','receita',NULL,NULL),
('cat_lazer_hobbies','LazerEHobbies','Lazer e Hobbies','Gamepad2','despesa',NULL,NULL),
('cat_mercado','Mercado','Mercado','ShoppingCart','despesa',NULL,NULL),
('cat_outras_receitas','OutrasReceitas','Outras Receitas','DollarSign','receita',NULL,NULL),
('cat_outros','Outros','Outros','Tags','despesa',NULL,NULL),
('cat_pets','Pets','Pets','Dog','despesa',NULL,NULL),
('cat_presentes_doacoes','PresentesEDoacoes','Presentes e Doações','Gift','despesa',NULL,NULL),
('cat_roupas','Roupas','Roupas','Shirt','despesa',NULL,NULL),
('cat_salario','Salario','Salário','Wallet','receita',NULL,NULL),
('cat_saude','Saude','Saúde','HeartPulse','despesa',NULL,NULL),
('cat_trabalho','Trabalho','Trabalho','Briefcase','despesa',NULL,NULL),
('cat_transporte','Transporte','Transporte','Car','despesa',NULL,NULL),
('cat_venda','Venda','Venda','Tag','receita',NULL,NULL),
('cat_viagem','Viagem','Viagem','Plane','despesa',NULL,NULL),
('cat_vicios','Vicios','Vícios','Flame','despesa',NULL,NULL);
/*!40000 ALTER TABLE `Category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `GameEvent`
--

DROP TABLE IF EXISTS `GameEvent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `GameEvent` (
  `id` varchar(191) NOT NULL,
  `type` enum('XP_MULTIPLIER','ITEM_DROP') NOT NULL,
  `description` varchar(191) NOT NULL,
  `multiplier` double DEFAULT NULL,
  `itemId` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `startAt` datetime(3) NOT NULL,
  `endAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GameEvent`
--

LOCK TABLES `GameEvent` WRITE;
/*!40000 ALTER TABLE `GameEvent` DISABLE KEYS */;
/*!40000 ALTER TABLE `GameEvent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Goal`
--

DROP TABLE IF EXISTS `Goal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Goal` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `targetAmount` decimal(18,4) NOT NULL,
  `currentAmount` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `status` enum('IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
  `deadline` datetime(3) DEFAULT NULL,
  `imageUrl` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) DEFAULT NULL,
  `accountId` varchar(191) DEFAULT NULL,
  `clanId` varchar(191) DEFAULT NULL,
  `cellFundId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Goal_cellFundId_key` (`cellFundId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Goal`
--

LOCK TABLES `Goal` WRITE;
/*!40000 ALTER TABLE `Goal` DISABLE KEYS */;
/*!40000 ALTER TABLE `Goal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `GoalContribution`
--

DROP TABLE IF EXISTS `GoalContribution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `GoalContribution` (
  `id` varchar(191) NOT NULL,
  `amount` decimal(18,4) NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `goalId` varchar(191) NOT NULL,
  `debitTransactionId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `GoalContribution_debitTransactionId_key` (`debitTransactionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GoalContribution`
--

LOCK TABLES `GoalContribution` WRITE;
/*!40000 ALTER TABLE `GoalContribution` DISABLE KEYS */;
/*!40000 ALTER TABLE `GoalContribution` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ImportTemplate`
--

DROP TABLE IF EXISTS `ImportTemplate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ImportTemplate` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `mapping` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`mapping`)),
  `userId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ImportTemplate`
--

LOCK TABLES `ImportTemplate` WRITE;
/*!40000 ALTER TABLE `ImportTemplate` DISABLE KEYS */;
/*!40000 ALTER TABLE `ImportTemplate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ImportedTransaction`
--

DROP TABLE IF EXISTS `ImportedTransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ImportedTransaction` (
  `id` varchar(191) NOT NULL,
  `date` datetime(3) NOT NULL,
  `amount` decimal(18,4) NOT NULL,
  `type` enum('CREDIT','DEBIT') NOT NULL,
  `description` varchar(191) NOT NULL,
  `fitId` varchar(191) NOT NULL,
  `status` enum('PENDING','SUGGESTED','RECONCILED','DISCARDED') NOT NULL DEFAULT 'PENDING',
  `reconciliationId` varchar(191) NOT NULL,
  `manualTransactionId` varchar(191) DEFAULT NULL,
  `similarityScore` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ImportedTransaction_fitId_key` (`fitId`),
  UNIQUE KEY `ImportedTransaction_manualTransactionId_key` (`manualTransactionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ImportedTransaction`
--

LOCK TABLES `ImportedTransaction` WRITE;
/*!40000 ALTER TABLE `ImportedTransaction` DISABLE KEYS */;
INSERT INTO `ImportedTransaction` VALUES
('cmi7tl71l000mzr7fkfekbqmc','2025-11-01 03:00:00.000',17.0000,'DEBIT','Compra no débito - HORTITGR','6906695f-bafb-463c-97dd-7be03c1d0ebd','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgkj0034zr7f7z6p914c',NULL),
('cmi7tl71l000nzr7fkm6zw36b','2025-11-01 03:00:00.000',119.9000,'DEBIT','Transferência enviada pelo Pix - Claro - 40.432.544/0001-47 - CLARO PAY S.A. IP Agência: 1 Conta: 1872704-2','69067f53-bd3a-4044-80e7-a16df44eebbe','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgkr0036zr7fod7t3fpt',NULL),
('cmi7tl71l000ozr7fi9otcw11','2025-11-01 03:00:00.000',217.3600,'DEBIT','Compra no débito - NOVO HORIZONTE COM DE','6906901f-6d78-4e4e-b643-3a13127edaa5','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgkw0038zr7fkv7f13be',NULL),
('cmi7tl71l000pzr7fepj0jb9w','2025-11-02 03:00:00.000',3.0000,'DEBIT','Transferência enviada pelo Pix - LIVEPIX - 43.192.126/0001-18 - EFÍ S.A. - IP (0364) Agência: 1 Conta: 314838-6','69076aa7-507f-4165-8c20-ffcbcec6c846','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgl3003azr7fqfdhcxve',NULL),
('cmi7tl71l000qzr7fkt3a83qz','2025-11-02 03:00:00.000',40.0000,'CREDIT','Transferência recebida pelo Pix - ABRAAO BARREIROS DOS REIS - •••.924.707-•• - ITAÚ UNIBANCO S.A. (0341) Agência: 7461 Conta: 17515-5','690790fb-2a91-4db8-8f62-4f5d7216c775','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgl9003czr7fta25048g',NULL),
('cmi7tl71l000rzr7fqotmaey8','2025-11-02 03:00:00.000',50.0000,'DEBIT','Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','6907913e-6c2d-462d-b018-6b5823e73051','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlglg003ezr7fnnecl09k',NULL),
('cmi7tl71l000szr7fc11ml16g','2025-11-02 03:00:00.000',11.0400,'DEBIT','Transferência enviada pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - ADYEN DO BRASIL IP LTDA. Agência: 1 Conta: 100000015-8','6907a4d9-e5c8-453a-902c-1015b9ccffd7','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlglm003gzr7fnev6vekj',NULL),
('cmi7tl71l000tzr7fctpyk3e3','2025-11-02 03:00:00.000',20.6000,'DEBIT','Transferência enviada pelo Pix - 99 FOOD - 60.112.920/0001-23 - ADYEN DO BRASIL IP LTDA. Agência: 1 Conta: 100000197-8','6907a90e-b11c-4aa8-9574-ef55b83f6fd6','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgls003izr7fiw1hvgxh',NULL),
('cmi7tl71l000uzr7fwim5c70i','2025-11-02 03:00:00.000',20.6000,'CREDIT','Reembolso recebido pelo Pix - 99 FOOD LTDA. - 60.112.920/0001-23 - ADYEN DO BRASIL IP LTDA. Agência: 1 Conta: 100000197-8','6907b22f-ac11-4183-868a-ce54e381aa64','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlglx003kzr7fpynccrfd',NULL),
('cmi7tl71l000vzr7fyok9gsah','2025-11-02 03:00:00.000',36.7000,'DEBIT','Transferência enviada pelo Pix - 99 FOOD - 60.112.920/0001-23 - ADYEN DO BRASIL IP LTDA. Agência: 1 Conta: 100000197-8','6907b6a5-9261-418d-a929-38ae8cc02716','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgm3003mzr7frnhvg2pj',NULL),
('cmi7tl71l000wzr7fj9eca8uj','2025-11-03 03:00:00.000',57.9700,'DEBIT','Compra no débito via NuPay - iFood','690881bb-953e-4121-b9d6-bab72c7186bf','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgm9003ozr7ftle88nwl',NULL),
('cmi7tl71l000xzr7fn8mqt42g','2025-11-03 03:00:00.000',57.9700,'CREDIT','Estorno - Compra no débito via NuPay - iFood','690881f2-827e-406b-8925-1b9ae5e7fbd3','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgmf003qzr7ffem9psuy',NULL),
('cmi7tl71l000yzr7fkos2e9o9','2025-11-03 03:00:00.000',59.9600,'DEBIT','Compra no débito via NuPay - iFood','6908823c-683b-43ff-9ee7-25bf7c8ee3e1','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgml003szr7fntvfftkp',NULL),
('cmi7tl71l000zzr7f7a4knctx','2025-11-03 03:00:00.000',7.5000,'DEBIT','Compra no débito - MP *PADARIATEMTUD','69088a6b-d35c-488a-9ee0-d4d16104c29a','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgmr003uzr7f4bqtzfyg',NULL),
('cmi7tl71l0010zr7f664ftgwj','2025-11-03 03:00:00.000',200.0000,'CREDIT','Transferência recebida pelo Pix - ANTONIO ANTUNES PEREIRA NETO - •••.138.207-•• - BCO BRADESCO S.A. (0237) Agência: 2490 Conta: 71505-0','690897cc-13f0-432d-a8a3-310f8f23e573','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgmx003wzr7ffifi509r',NULL),
('cmi7tl71l0011zr7fqobzrd09','2025-11-03 03:00:00.000',220.0000,'DEBIT','Aplicação RDB','690897f5-2d7c-44f1-b5b2-58e8b7e25bcf','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgn4003yzr7fhwc65x7z',NULL),
('cmi7tl71l0012zr7fafdq1tng','2025-11-03 03:00:00.000',6.5000,'DEBIT','Compra no débito - MARCELLO GERHARDT LOUZ','6908d277-ee0f-48e0-a659-2d6ad17e27f6','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgn90040zr7fhzb01px8',NULL),
('cmi7tl71l0013zr7fkk4pdy3s','2025-11-03 03:00:00.000',20.3000,'DEBIT','Compra no débito - MP *AVEIGADESCART','6908d2dd-05f4-46f8-a643-706c807f2bb4','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgng0042zr7ff7u2gssj',NULL),
('cmi7tl71l0014zr7f7fp8jlcn','2025-11-03 03:00:00.000',2.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','6909062e-afe0-462f-bd9e-cdc1a3aa8522','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgnn0044zr7f7pjr40c7',NULL),
('cmi7tl71l0015zr7f2c1bfehm','2025-11-03 03:00:00.000',4.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','69090a11-34eb-4923-8f3f-a5aa0bacdb52','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgnt0046zr7fhg8bmx5e',NULL),
('cmi7tl71l0016zr7fr8hcc4co','2025-11-03 03:00:00.000',53.0600,'DEBIT','Transferência enviada pelo Pix - 99 FOOD - 60.112.920/0001-23 - ADYEN DO BRASIL IP LTDA. Agência: 1 Conta: 100000197-8','69094cf6-e866-4a7e-8678-1a3638331c84','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgnz0048zr7fhx0k8gyo',NULL),
('cmi7tl71l0017zr7fiof8sj4q','2025-11-04 03:00:00.000',6.6300,'DEBIT','Transferência enviada pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - BANCO BTG PACTUAL S.A. (0208) Agência: 30 Conta: 571873-6','690a27bb-0b8e-412c-bf13-7784e7c07add','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgo4004azr7f72riusk7',NULL),
('cmi7tl71l0018zr7foamul4ld','2025-11-04 03:00:00.000',3.5000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','690a2a69-4771-490f-a539-448eb081b847','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgoa004czr7fnatwy4m6',NULL),
('cmi7tl71l0019zr7fglizuoa8','2025-11-04 03:00:00.000',6.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','690a5894-05a8-4623-8518-f6421a654722','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgog004ezr7fpid419dr',NULL),
('cmi7tl71l001azr7f7ablomnd','2025-11-04 03:00:00.000',4.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','690a5bb8-dc96-4b05-810f-f0b9197020b4','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgom004gzr7fuqzt2xvt',NULL),
('cmi7tl71l001bzr7fag4zfy6z','2025-11-05 03:00:00.000',22.9800,'DEBIT','Compra no débito via NuPay - iFood','690b5a99-6812-4020-aad2-2a4f4feff20f','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgos004izr7fw1iibnuf',NULL),
('cmi7tl71l001czr7fau02vlwn','2025-11-05 03:00:00.000',5.5000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','690b73cc-8e14-4b41-8067-5953d49a3f03','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgoy004kzr7fwxdi45jo',NULL),
('cmi7tl71l001dzr7f621pgox2','2025-11-05 03:00:00.000',2.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','690b7c83-e544-44fd-9390-1031696aa463','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgp4004mzr7frcvqj768',NULL),
('cmi7tl71l001ezr7fuaxwajax','2025-11-05 03:00:00.000',3142.4500,'CREDIT','Transferência recebida pelo Pix via Open Banking - EDSON CANTUARIA DE AZEVEDO NETO - •••.244.607-•• - BCO SANTANDER (BRASIL) S.A. (0033) Agência: 2969 Conta: 3033985-7','690beeb7-dc83-4687-8dae-df9514b72aa0','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgpb004ozr7fp5ms7edy',NULL),
('cmi7tl71l001fzr7fpwmw2roa','2025-11-05 03:00:00.000',1229.2000,'DEBIT','Pagamento de fatura','690beed3-45f2-48b5-a605-997bd8916d65','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgpg004qzr7fl4q47e9f',NULL),
('cmi7tl71l001gzr7f2q8e5xzs','2025-11-05 03:00:00.000',800.0000,'DEBIT','Transferência enviada pelo Pix - GABRIEL MAGRI TOSATTO - •••.324.547-•• - BANCO INTER (0077) Agência: 1 Conta: 12847069-0','690bef42-14d5-4467-8c84-b2e9135bc8bf','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgpm004szr7f6f6i9gu8',NULL),
('cmi7tl71l001hzr7fmllty5td','2025-11-05 03:00:00.000',150.0000,'DEBIT','Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','690bef79-8602-4675-a78d-d337470fc06e','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgpt004uzr7f9msp46p4',NULL),
('cmi7tl71l001izr7f8tznbj1t','2025-11-05 03:00:00.000',200.0000,'DEBIT','Aplicação RDB','690befde-633d-4376-a7f9-905ab6c9f3a7','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgq0004wzr7f04rmogo1',NULL),
('cmi7tl71l001jzr7fdn3x292e','2025-11-06 03:00:00.000',20.0000,'DEBIT','Recarga de celular','690c8e08-4eaa-471d-b79d-e540a2e4d708','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgq6004yzr7fy50x1psk',NULL),
('cmi7tl71m001kzr7fgwcov8ih','2025-11-06 03:00:00.000',24.9900,'DEBIT','Compra no débito via NuPay - iFood','690cb048-0b90-4d10-84d1-235211bf90f6','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgqd0050zr7fiwstu49d',NULL),
('cmi7tl71m001lzr7f6aqhrts6','2025-11-06 03:00:00.000',40.0000,'DEBIT','Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','690cb3c8-1a58-4038-ab8d-a713f02d93f1','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgqj0052zr7fdgz9hkrr',NULL),
('cmi7tl71m001mzr7f1tmdvg30','2025-11-06 03:00:00.000',2.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','690cff47-5458-4c89-8c31-2c57792ad86b','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgqq0054zr7fro3ckwq6',NULL),
('cmi7tl71m001nzr7f0ador56h','2025-11-07 03:00:00.000',16.9700,'DEBIT','Compra no débito - NOVO HORIZONTE COM DE','690e23fe-26ca-4828-9822-569ef13d6e16','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgqv0056zr7fno1b4ttd',NULL),
('cmi7tl71m001ozr7f0gvoc6tw','2025-11-07 03:00:00.000',14.0000,'DEBIT','Compra no débito - HORT TGR','690e64a4-2946-4c3e-83cb-260d2ed99b44','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgr00058zr7ffqura0ds',NULL),
('cmi7tl71m001pzr7fphw0z764','2025-11-08 03:00:00.000',14.9000,'DEBIT','Transferência enviada pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - BANCO BTG PACTUAL S.A. (0208) Agência: 30 Conta: 571873-6','690f95a0-be20-415d-a851-c768d582f6c4','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgr6005azr7fk2xjv9pn',NULL),
('cmi7tl71m001qzr7fsir6flz1','2025-11-08 03:00:00.000',6.0000,'DEBIT','Compra no débito - HORT TGR','690fa398-2721-4c5b-b0a4-697a32f4d76b','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgrb005czr7fnrvrce8o',NULL),
('cmi7tl71m001rzr7f1e94rwp8','2025-11-08 03:00:00.000',52.0400,'DEBIT','Compra no débito - NOVO HORIZONTE COM DE','690fb28e-cad0-45fe-b5c3-ba1726a45f20','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgrh005ezr7flk8r3nlk',NULL),
('cmi7tl71m001szr7f3kqk2hsz','2025-11-08 03:00:00.000',11.3700,'DEBIT','Transferência enviada pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - BANCO BTG PACTUAL S.A. (0208) Agência: 30 Conta: 292948-0','690fb3b4-3b2a-47e2-bc92-9f27b38c330f','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgrm005gzr7fe43zh34r',NULL),
('cmi7tl71m001tzr7f9w2cyzvt','2025-11-08 03:00:00.000',100.0000,'DEBIT','Compra no débito - ELIANE GONCALVES DE FA','690fc8de-3960-4438-a8d8-1cc696125167','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgrs005izr7fsaj3en4d',NULL),
('cmi7tl71m001uzr7fbi1br7g5','2025-11-08 03:00:00.000',8.4000,'DEBIT','Transferência enviada pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - BANCO BTG PACTUAL S.A. (0208) Agência: 30 Conta: 292948-0','690fcda9-1968-4f0b-beff-7d7bd3c64d2f','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgrx005kzr7fdfbm87nj',NULL),
('cmi7tl71m001vzr7fhkkettwy','2025-11-08 03:00:00.000',3.0700,'CREDIT','Reembolso recebido pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - BANCO BTG PACTUAL S.A. (0208) Agência: 30 Conta: 292948-0','690fce4f-c2a8-4891-a6d5-51b73581fb0e','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgs4005mzr7fifoqyrte',NULL),
('cmi7tl71m001wzr7fp6y09r56','2025-11-08 03:00:00.000',50.0000,'DEBIT','Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','690fd3db-eec4-4fdb-aca9-4dba95ee9aef','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgs8005ozr7fza3uaiwg',NULL),
('cmi7tl71m001xzr7f8kmm4pic','2025-11-09 03:00:00.000',100.0000,'DEBIT','Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','691064f3-485b-419a-abdc-447935992776','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgsc005qzr7f3jekxkvs',NULL),
('cmi7tl71m001yzr7fnuuabxwe','2025-11-10 03:00:00.000',40.0000,'DEBIT','Transferência enviada pelo Pix - Edson Cantuaria de Azevedo Neto - •••.244.607-•• - MERCADO PAGO IP LTDA. (0323) Agência: 1 Conta: 4537386183-9','69120a36-4458-48d1-8ab9-8f63a8d5fa9a','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgsg005szr7f59ttmxvj',NULL),
('cmi7tl71m001zzr7fuh3m5rse','2025-11-11 03:00:00.000',20.0000,'DEBIT','Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','69135260-94dc-4de2-a232-262b68293f69','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgsk005uzr7fj99akg5l',NULL),
('cmi7tl71m0020zr7fb03mqeee','2025-11-11 03:00:00.000',20.0000,'DEBIT','Compra no débito - HORT TGR','691362e8-c9d0-4ede-9ec5-35564590a31b','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgjn000nzrzjxpkn654e',NULL),
('cmi7tl71m0021zr7flh7s9k6r','2025-11-11 03:00:00.000',11.9300,'DEBIT','Compra no débito via NuPay - Uber','69136d11-7426-4a61-b664-c793b1d5bc5a','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgjx000pzrzjh5u7fefh',NULL),
('cmi7tl71m0022zr7fphe6we8s','2025-11-11 03:00:00.000',2.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','69136fe9-2a7b-4f52-b314-b64549137ad4','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgk4000rzrzjbk4pvjcp',NULL),
('cmi7tl71m0023zr7funfvc4jo','2025-11-11 03:00:00.000',2.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','69139356-b716-4844-b604-98afd10e7a91','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgka000tzrzjcv4dbzus',NULL),
('cmi7tl71m0024zr7fzb2ckzu0','2025-11-11 03:00:00.000',60.0000,'CREDIT','Transferência recebida pelo Pix - ABRAAO BARREIROS DOS REIS - •••.924.707-•• - ITAÚ UNIBANCO S.A. (0341) Agência: 7461 Conta: 17515-5','6913b47d-86e7-4412-aa02-f2e8dd295896','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgki000vzrzjdvkbgspu',NULL),
('cmi7tl71m0025zr7fkgzx4byv','2025-11-11 03:00:00.000',60.0000,'DEBIT','Pagamento de fatura','6913b73d-e075-4ecd-a670-eaabfba5f9ef','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgkp000xzrzjj5sjlr03',NULL),
('cmi7tl71m0026zr7f3d95qjmi','2025-11-12 03:00:00.000',60.0400,'CREDIT','Transferência recebida pelo Pix - Edson Cantuaria de Azevedo Neto - •••.244.607-•• - MERCADO PAGO IP LTDA. (0323) Agência: 1 Conta: 4537386183-9','6914aaf3-a6a3-46a2-b52d-78d26bdc8f3c','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgkw000zzrzjhm3y0ghi',NULL),
('cmi7tl71m0027zr7fccogdlif','2025-11-12 03:00:00.000',4.0000,'DEBIT','Compra no débito - HORT TGR','6914bc28-32c6-4e6f-8d3d-66928c37278e','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgl20011zrzjonztu1lo',NULL),
('cmi7tl71m0028zr7fkwk36gc0','2025-11-12 03:00:00.000',344.0000,'DEBIT','Transferência enviada pelo Pix - Jeanne Magri Vieira - •••.055.327-•• - BCO SANTANDER (BRASIL) S.A. (0033) Agência: 2283 Conta: 1009575-6','6914e72f-b7af-4a83-9630-9a02ffad2c31','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgl90013zrzjq05zw7ho',NULL),
('cmi7tl71m0029zr7fxtcmowl5','2025-11-12 03:00:00.000',2.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','6914e770-cbcf-43d6-a456-8bafeb15c622','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlglg0015zrzjqxz759wc',NULL),
('cmi7tl71m002azr7fiox5hq0b','2025-11-12 03:00:00.000',21.0000,'DEBIT','Compra no débito - ELIANE GONCALVES DE FA','69150510-31c7-489e-a8ac-0367510bb859','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlglm0017zrzjj1k89a5f',NULL),
('cmi7tl71m002bzr7fj42073j1','2025-11-12 03:00:00.000',40.0000,'DEBIT','Transferência enviada pelo Pix - NIC. BR - 05.506.560/0001-36 - EFÍ S.A. - IP (0364) Agência: 1 Conta: 276784-8','69150ce3-5b91-45da-be1d-9ec104081e57','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgls0019zrzjukko8b27',NULL),
('cmi7tl71m002czr7f42rj4ff4','2025-11-13 03:00:00.000',8.9900,'DEBIT','Compra no débito via NuPay - iFood','6915e3ff-0972-4346-8271-64dfecb34ad0','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgly001bzrzj1mkn6fih',NULL),
('cmi7tl71m002dzr7f1m0mgqz9','2025-11-13 03:00:00.000',3.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','6915fd5e-ca47-45e9-8ffd-ff9627f81cbc','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgm4001dzrzj4epgq6c3',NULL),
('cmi7tl71m002ezr7fz796v8aj','2025-11-13 03:00:00.000',15.0000,'DEBIT','Aplicação RDB','69162a7a-db8d-452d-9c6c-02daf91034a9','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgma001fzrzjteghgeel',NULL),
('cmi7tl71m002fzr7fi3two80u','2025-11-14 03:00:00.000',400.0000,'CREDIT','Transferência recebida pelo Pix - ANTONIO ANTUNES PEREIRA NETO - •••.138.207-•• - BCO BRADESCO S.A. (0237) Agência: 2490 Conta: 71505-0','6916e7c2-ae94-48b2-a817-679ffbd2739b','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgmg001hzrzj2scze1xj',NULL),
('cmi7tl71m002gzr7flc5hphk8','2025-11-14 03:00:00.000',400.0000,'DEBIT','Aplicação RDB','6916e839-e037-46db-9515-cefd086f7c76','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgmm001jzrzjpkz61uoy',NULL),
('cmi7tl71m002hzr7f92e83f0m','2025-11-14 03:00:00.000',5.5000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','69171d9a-577f-4bdd-80fc-de06f3fcd387','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgms001lzrzjuzwmo1fx',NULL),
('cmi7tl71m002izr7fiyh099bo','2025-11-14 03:00:00.000',26.0000,'DEBIT','Compra no débito - QDelicia','691763f8-68c8-49ab-88d1-50f8e952fb67','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgmz001nzrzjz3ynd9xu',NULL),
('cmi7tl71n002jzr7fxyq5irdz','2025-11-14 03:00:00.000',4.7500,'DEBIT','Transferência enviada pelo Pix - Giulia de Almeida Teixeira - •••.242.477-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 9314472-3','69176446-cab8-4c7c-9b91-ad2648aa205a','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgn4001pzrzjk4p2zh16',NULL),
('cmi7tl71n002kzr7fysi420mn','2025-11-14 03:00:00.000',2.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','69177b0e-3432-4619-a55b-f73926b6c8c0','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgnb001rzrzjl4qlmbbv',NULL),
('cmi7tl71n002lzr7f3c5az7lo','2025-11-14 03:00:00.000',3.0000,'DEBIT','Transferência enviada pelo Pix - Giulia de Almeida Teixeira - •••.242.477-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 9314472-3','69178bc4-861e-4aa0-a422-2b439df99c63','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgng001tzrzjch1fcebk',NULL),
('cmi7tl71n002mzr7fh6hyg4rd','2025-11-14 03:00:00.000',3.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','69178cba-5d11-4cde-9b75-d6837b1335b0','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgnm001vzrzjhpeu5egp',NULL),
('cmi7tl71n002nzr7fshrccohj','2025-11-14 03:00:00.000',30.0000,'DEBIT','Compra no débito - VetsTecnologia','6917a526-6271-43b5-944f-d1d8f28911a8','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgnr001xzrzj247g9w43',NULL),
('cmi7tl71n002ozr7fye8va511','2025-11-14 03:00:00.000',15.0000,'DEBIT','Compra no débito - VetsTecnologia','6917aaf1-8bc0-4f59-a4ee-9935122e4f17','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgnx001zzrzj3plk1qxb',NULL),
('cmi7tl71n002pzr7fnon67tv8','2025-11-14 03:00:00.000',30.0000,'DEBIT','Compra no débito - VetsTecnologia','6917ac6e-f7d5-41ad-852a-81e64785569b','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgo30021zrzjq9fspwwa',NULL),
('cmi7tl71n002qzr7ff37howd1','2025-11-14 03:00:00.000',10.0000,'DEBIT','Compra no débito - REVITALE IMPORT','6917bb07-5aef-4f9b-82de-825e99b13d69','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgo80023zrzjxg282gtn',NULL),
('cmi7tl71n002rzr7ft56fj4er','2025-11-14 03:00:00.000',30.0000,'DEBIT','Compra no débito - VetsTecnologia','6917c584-0a31-45f3-abe9-7b0d1846ff04','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgoe0025zrzjzru89t8z',NULL),
('cmi7tl71n002szr7fnk9aennw','2025-11-15 03:00:00.000',20.0000,'CREDIT','Resgate RDB','691871b5-7f35-424f-a0a6-16978971676e','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgok0027zrzjbtkkac4g',NULL),
('cmi7tl71n002tzr7f9k2cs70i','2025-11-15 03:00:00.000',85.0000,'DEBIT','Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','691871c4-00d8-4cdb-98b4-004ca7ed1a33','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgoq0029zrzjogfcobvw',NULL),
('cmi7tl71n002uzr7fsh144i4y','2025-11-15 03:00:00.000',2.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','6918b91d-213a-4640-94aa-16cec92274ba','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgow002bzrzj6h1v8h28',NULL),
('cmi7tl71n002vzr7fgtobkjuz','2025-11-15 03:00:00.000',200.0000,'CREDIT','Transferência recebida pelo Pix - ANTONIO ANTUNES PEREIRA NETO - •••.138.207-•• - ITAÚ UNIBANCO S.A. (0341) Agência: 7333 Conta: 31620-1','691914c4-52a9-410f-b972-3bdd90a06c21','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgp2002dzrzjxss9i655',NULL),
('cmi7tl71n002wzr7fu77jr0xn','2025-11-15 03:00:00.000',200.0000,'DEBIT','Aplicação RDB','69191770-9026-410c-8ce9-c22d06f7bd27','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgp9002fzrzj74jldyfd',NULL),
('cmi7tl71n002xzr7fwnu86t2s','2025-11-17 03:00:00.000',2.6000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','691b49fb-1809-4945-8a9c-abfc97cf3d72','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgpf002hzrzj2mrk33oa',NULL),
('cmi7tl71n002yzr7frs8ef1m6','2025-11-17 03:00:00.000',2.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','691b5025-6a69-4b9f-ab23-b44b1a5b8084','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgpm002jzrzj7w0s1gvm',NULL),
('cmi7tl71n002zzr7ftv3tz19g','2025-11-18 03:00:00.000',3.6000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','691c61ca-6e35-418b-84c9-47939de2b36e','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgps002lzrzjn1o1ct01',NULL),
('cmi7tl71n0030zr7fi3j1uwzu','2025-11-18 03:00:00.000',3.0000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','691cce52-708e-4b2c-8bcf-60e963bffefb','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgpz002nzrzjn40pay72',NULL),
('cmi7tl71n0031zr7fd4tt1ki2','2025-11-18 03:00:00.000',2.3000,'CREDIT','Valor adicionado na conta por cartão de crédito - Valor adicionado para Pix no Crédito','691cd0f2-425a-4904-8793-3ab827fbbc3b','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgq5002pzrzjf5o5ow9y',NULL),
('cmi7tl71n0032zr7fig9wq5t3','2025-11-18 03:00:00.000',2.3000,'DEBIT','Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','691cd0f2-425a-4904-8793-3ab827fbbc3b:reversal','RECONCILED','cmi7tl6um000azrz719zgeskk','cmi7tlgqb002rzrzjfyhno62b',NULL);
/*!40000 ALTER TABLE `ImportedTransaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `InvestmentContribution`
--

DROP TABLE IF EXISTS `InvestmentContribution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `InvestmentContribution` (
  `id` varchar(191) NOT NULL,
  `planId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `accountId` varchar(191) NOT NULL,
  `fromAccountId` varchar(191) NOT NULL,
  `holdingId` varchar(191) DEFAULT NULL,
  `amount` decimal(18,4) NOT NULL,
  `leisureImpact` decimal(18,4) DEFAULT 0.0000,
  `status` enum('PENDING','EXECUTED','FAILED') NOT NULL DEFAULT 'EXECUTED',
  `source` enum('MANUAL','AUTOMATION','WINDFALL','AI_SUGGESTION') NOT NULL DEFAULT 'MANUAL',
  `notes` text DEFAULT NULL,
  `analysisSnapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`analysisSnapshot`)),
  `debitTransactionId` varchar(191) DEFAULT NULL,
  `creditTransactionId` varchar(191) DEFAULT NULL,
  `executedAt` datetime(3) DEFAULT NULL,
  `month` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `InvestmentContribution_debitTransactionId_key` (`debitTransactionId`),
  UNIQUE KEY `InvestmentContribution_creditTransactionId_key` (`creditTransactionId`),
  KEY `InvestmentContribution_planId_month_idx` (`planId`,`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InvestmentContribution`
--

LOCK TABLES `InvestmentContribution` WRITE;
/*!40000 ALTER TABLE `InvestmentContribution` DISABLE KEYS */;
/*!40000 ALTER TABLE `InvestmentContribution` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `InvestmentHolding`
--

DROP TABLE IF EXISTS `InvestmentHolding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `InvestmentHolding` (
  `id` varchar(191) NOT NULL,
  `planId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `accountId` varchar(191) NOT NULL,
  `assetClass` varchar(191) NOT NULL,
  `ticker` varchar(191) DEFAULT NULL,
  `currentAmount` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `expectedReturn` decimal(10,4) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `goalId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InvestmentHolding`
--

LOCK TABLES `InvestmentHolding` WRITE;
/*!40000 ALTER TABLE `InvestmentHolding` DISABLE KEYS */;
/*!40000 ALTER TABLE `InvestmentHolding` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `InvestmentMetricSnapshot`
--

DROP TABLE IF EXISTS `InvestmentMetricSnapshot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `InvestmentMetricSnapshot` (
  `id` varchar(191) NOT NULL,
  `month` varchar(191) NOT NULL,
  `soloPlanAdoptionPct` decimal(6,4) NOT NULL DEFAULT 0.0000,
  `avgContributionIncomeRatio` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `planAdherenceRate` decimal(6,4) NOT NULL DEFAULT 0.0000,
  `nudgeConversionRate` decimal(6,4) NOT NULL DEFAULT 0.0000,
  `adoptionRate` decimal(6,4) NOT NULL DEFAULT 0.0000,
  `churnRate` decimal(6,4) NOT NULL DEFAULT 0.0000,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `InvestmentMetricSnapshot_month_key` (`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InvestmentMetricSnapshot`
--

LOCK TABLES `InvestmentMetricSnapshot` WRITE;
/*!40000 ALTER TABLE `InvestmentMetricSnapshot` DISABLE KEYS */;
/*!40000 ALTER TABLE `InvestmentMetricSnapshot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `InvestmentNudgeConversion`
--

DROP TABLE IF EXISTS `InvestmentNudgeConversion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `InvestmentNudgeConversion` (
  `id` varchar(191) NOT NULL,
  `planId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `aiAnalysisId` varchar(191) NOT NULL,
  `targetAmount` decimal(18,4) NOT NULL,
  `triggeredAt` datetime(3) NOT NULL,
  `convertedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InvestmentNudgeConversion`
--

LOCK TABLES `InvestmentNudgeConversion` WRITE;
/*!40000 ALTER TABLE `InvestmentNudgeConversion` DISABLE KEYS */;
/*!40000 ALTER TABLE `InvestmentNudgeConversion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `InvestmentPlan`
--

DROP TABLE IF EXISTS `InvestmentPlan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `InvestmentPlan` (
  `id` varchar(191) NOT NULL,
  `priority` enum('investir','lazer','balanceado') NOT NULL DEFAULT 'investir',
  `targetPercent` decimal(5,4) NOT NULL DEFAULT 0.2000,
  `targetAmountMin` decimal(18,2) NOT NULL DEFAULT 0.00,
  `targetAmount` decimal(18,2) DEFAULT NULL,
  `leisureFloor` decimal(18,2) NOT NULL DEFAULT 0.00,
  `leisurePercentMin` decimal(5,4) NOT NULL DEFAULT 0.1500,
  `emergencyFundTarget` decimal(18,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('ACTIVE','PAUSED','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `InvestmentPlan_userId_key` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InvestmentPlan`
--

LOCK TABLES `InvestmentPlan` WRITE;
/*!40000 ALTER TABLE `InvestmentPlan` DISABLE KEYS */;
/*!40000 ALTER TABLE `InvestmentPlan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `InvestmentSnapshot`
--

DROP TABLE IF EXISTS `InvestmentSnapshot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `InvestmentSnapshot` (
  `id` varchar(191) NOT NULL,
  `planId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `month` varchar(191) NOT NULL,
  `totalInvested` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `totalReturns` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `leisureSpent` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `deltaVsPlan` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `confidenceScore` decimal(5,2) DEFAULT NULL,
  `commentaryJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`commentaryJson`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `InvestmentSnapshot_planId_month_key` (`planId`,`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InvestmentSnapshot`
--

LOCK TABLES `InvestmentSnapshot` WRITE;
/*!40000 ALTER TABLE `InvestmentSnapshot` DISABLE KEYS */;
/*!40000 ALTER TABLE `InvestmentSnapshot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Item`
--

DROP TABLE IF EXISTS `Item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Item` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `bonusJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bonusJson`)),
  `rarity` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Item_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Item`
--

LOCK TABLES `Item` WRITE;
/*!40000 ALTER TABLE `Item` DISABLE KEYS */;
/*!40000 ALTER TABLE `Item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `LedgerEntry`
--

DROP TABLE IF EXISTS `LedgerEntry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `LedgerEntry` (
  `id` varchar(191) NOT NULL,
  `transactionId` varchar(191) NOT NULL,
  `accountId` varchar(191) NOT NULL,
  `direction` enum('DEBIT','CREDIT') NOT NULL,
  `amount` decimal(18,4) NOT NULL,
  `currency` enum('BRL','USD') NOT NULL DEFAULT 'BRL',
  `exchangeRate` decimal(18,8) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `LedgerEntry_transactionId_accountId_direction_key` (`transactionId`,`accountId`,`direction`),
  KEY `LedgerEntry_transactionId_idx` (`transactionId`),
  KEY `LedgerEntry_accountId_idx` (`accountId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LedgerEntry`
--

LOCK TABLES `LedgerEntry` WRITE;
/*!40000 ALTER TABLE `LedgerEntry` DISABLE KEYS */;
/*!40000 ALTER TABLE `LedgerEntry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `LegacyRuin`
--

DROP TABLE IF EXISTS `LegacyRuin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `LegacyRuin` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `totalAmountPaid` decimal(18,4) NOT NULL,
  `totalInterestPaid` decimal(18,4) DEFAULT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) NOT NULL,
  `originalRecurrenceId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `LegacyRuin_originalRecurrenceId_key` (`originalRecurrenceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LegacyRuin`
--

LOCK TABLES `LegacyRuin` WRITE;
/*!40000 ALTER TABLE `LegacyRuin` DISABLE KEYS */;
/*!40000 ALTER TABLE `LegacyRuin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Mission`
--

DROP TABLE IF EXISTS `Mission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Mission` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `scope` enum('USER','GUILD') NOT NULL DEFAULT 'USER',
  `xpReward` int(11) NOT NULL,
  `itemRewardId` varchar(191) DEFAULT NULL,
  `minLevel` int(11) NOT NULL DEFAULT 1,
  `requiredClass` varchar(191) DEFAULT NULL,
  `triggerSpec` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`triggerSpec`)),
  `isRepeatable` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Mission`
--

LOCK TABLES `Mission` WRITE;
/*!40000 ALTER TABLE `Mission` DISABLE KEYS */;
/*!40000 ALTER TABLE `Mission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Notification`
--

DROP TABLE IF EXISTS `Notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notification` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` varchar(191) NOT NULL,
  `type` enum('TRANSACTION_CREATED','PAYMENT_DUE','LIMIT_ALERT','ACHIEVEMENT_UNLOCKED','BUDGET_ALERT','UPCOMING_PAYMENT','STREAK_AWARDED','SECURITY_ALERT','FAMILY_UPDATE') NOT NULL,
  `read` tinyint(1) NOT NULL DEFAULT 0,
  `relatedId` varchar(191) DEFAULT NULL,
  `actions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`actions`)),
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notification`
--

LOCK TABLES `Notification` WRITE;
/*!40000 ALTER TABLE `Notification` DISABLE KEYS */;
INSERT INTO `Notification` VALUES
('cmi7f82h9000dzr40jxv9ff1u','Level Up!','Parabéns! Você alcançou o Nível 2!','ACHIEVEMENT_UNLOCKED',1,NULL,'[]','cmi7b69q20000zrs7cvqaxass','2025-11-20 12:42:06.093'),
('cmi7f82hh000fzr40jgul4d0d','Conquista Desbloqueada: Planejador Mestre!','Você definiu seu primeiro orçamento. Um grande passo para o controle financeiro!','ACHIEVEMENT_UNLOCKED',0,NULL,'[]','cmi7b69q20000zrs7cvqaxass','2025-11-20 12:42:06.102'),
('cmi7ggbcb000jzr4083q3tdws','Nova receita registrada','Nubank - R$ 1.00','TRANSACTION_CREATED',0,'cmi7ggbbh000hzr40r2to8vml','[]','cmi7b69q20000zrs7cvqaxass','2025-11-20 13:16:30.443'),
('cmi7w9ape0005zrmqvz3labsd','Novo dispositivo detectado','Detectamos um novo acesso em Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36. Se não foi você, altere sua senha imediatamente.','SECURITY_ALERT',0,NULL,'[]','cmi7b69q20000zrs7cvqaxass','2025-11-20 20:38:56.882'),
('cmi855im5000ezrm1ptlt9xwm','Level Up!','Parabéns! Você alcançou o Nível 2!','ACHIEVEMENT_UNLOCKED',0,NULL,'[]','cmi853w170000zrm1zzvlkdn3','2025-11-21 00:47:57.053'),
('cmi855ime000gzrm1qgkhfowf','Conquista Desbloqueada: Planejador Mestre!','Você definiu seu primeiro orçamento. Um grande passo para o controle financeiro!','ACHIEVEMENT_UNLOCKED',0,NULL,'[]','cmi853w170000zrm1zzvlkdn3','2025-11-21 00:47:57.062'),
('cmi8560y0000kzrm18zs9n9rq','Nova despesa registrada','Ifood - R$ 20.00','TRANSACTION_CREATED',0,'cmi8560x3000izrm1jpo7x8eq','[]','cmi853w170000zrm1zzvlkdn3','2025-11-21 00:48:20.808');
/*!40000 ALTER TABLE `Notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Reconciliation`
--

DROP TABLE IF EXISTS `Reconciliation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Reconciliation` (
  `id` varchar(191) NOT NULL,
  `startDate` datetime(3) DEFAULT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `status` enum('PROCESSING','PENDING_REVIEW','COMPLETED','FAILED') NOT NULL DEFAULT 'PROCESSING',
  `filePath` varchar(191) NOT NULL,
  `fileType` varchar(191) NOT NULL,
  `totalJobs` int(11) NOT NULL DEFAULT 0,
  `completedJobs` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  `accountId` varchar(191) DEFAULT NULL,
  `cardId` varchar(191) DEFAULT NULL,
  `importTemplateId` varchar(191) DEFAULT NULL,
  `balanceDifference` decimal(14,2) DEFAULT NULL,
  `statementClosingBalance` decimal(14,2) DEFAULT NULL,
  `statementCurrency` varchar(191) DEFAULT 'BRL',
  `statementOpeningBalance` decimal(14,2) DEFAULT NULL,
  `statementTimezone` varchar(191) DEFAULT 'America/Sao_Paulo',
  `systemClosingBalance` decimal(14,2) DEFAULT NULL,
  `systemOpeningBalance` decimal(14,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Reconciliation`
--

LOCK TABLES `Reconciliation` WRITE;
/*!40000 ALTER TABLE `Reconciliation` DISABLE KEYS */;
INSERT INTO `Reconciliation` VALUES
('cmi7tl6um000azrz719zgeskk','2025-11-01 03:00:00.000','2025-11-19 02:59:59.999','COMPLETED','reconciliations/cmi7b69q20000zrs7cvqaxass/47a440f82752bcce9c26a8360b7ff829.ofx','OFX',2,2,'2025-11-20 19:24:12.910','cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,NULL,0.00,1.99,'BRL',1046.60,'America/Sao_Paulo',1.99,1046.60);
/*!40000 ALTER TABLE `Reconciliation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RecurringBill`
--

DROP TABLE IF EXISTS `RecurringBill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `RecurringBill` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `amount` decimal(18,4) NOT NULL,
  `currency` enum('BRL','USD') NOT NULL DEFAULT 'BRL',
  `type` enum('receita','despesa') NOT NULL,
  `status` enum('ACTIVE','PAUSED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `recurrenceType` enum('WEEKLY','BIWEEKLY','MONTHLY','BIMONTHLY','TRIMONTHLY','SEMIANNUALLY') NOT NULL,
  `dueDayOfMonth` int(11) DEFAULT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `nextOccurrenceAt` datetime(3) DEFAULT NULL,
  `remindDaysBefore` int(11) NOT NULL DEFAULT 2,
  `autopayEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `autoPayAccountId` varchar(191) DEFAULT NULL,
  `autoPayCardId` varchar(191) DEFAULT NULL,
  `accountId` varchar(191) DEFAULT NULL,
  `cardId` varchar(191) DEFAULT NULL,
  `categoryId` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `lastGeneratedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RecurringBill`
--

LOCK TABLES `RecurringBill` WRITE;
/*!40000 ALTER TABLE `RecurringBill` DISABLE KEYS */;
/*!40000 ALTER TABLE `RecurringBill` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RoundUpEntry`
--

DROP TABLE IF EXISTS `RoundUpEntry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `RoundUpEntry` (
  `id` varchar(191) NOT NULL,
  `transactionId` varchar(191) NOT NULL,
  `amount` decimal(18,4) NOT NULL,
  `processed` tinyint(1) NOT NULL DEFAULT 0,
  `processedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RoundUpEntry_transactionId_key` (`transactionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RoundUpEntry`
--

LOCK TABLES `RoundUpEntry` WRITE;
/*!40000 ALTER TABLE `RoundUpEntry` DISABLE KEYS */;
/*!40000 ALTER TABLE `RoundUpEntry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Tag`
--

DROP TABLE IF EXISTS `Tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Tag` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Tag_userId_name_key` (`userId`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Tag`
--

LOCK TABLES `Tag` WRITE;
/*!40000 ALTER TABLE `Tag` DISABLE KEYS */;
/*!40000 ALTER TABLE `Tag` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Transaction`
--

DROP TABLE IF EXISTS `Transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Transaction` (
  `id` varchar(191) NOT NULL,
  `valor` decimal(18,4) NOT NULL,
  `descricao` varchar(191) NOT NULL,
  `tipo` enum('receita','despesa') NOT NULL,
  `data` datetime(3) NOT NULL,
  `metodoPagamento` enum('debito','credito','pix','dinheiro','transferencia') NOT NULL,
  `currency` enum('BRL','USD') NOT NULL DEFAULT 'BRL',
  `status` enum('PENDING','POSTED','CANCELLED','FAILED') NOT NULL DEFAULT 'POSTED',
  `pago` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `installment` tinyint(1) DEFAULT 0,
  `installmentId` varchar(191) DEFAULT NULL,
  `installmentNumber` int(11) DEFAULT NULL,
  `totalInstallments` int(11) DEFAULT NULL,
  `withInterest` tinyint(1) DEFAULT 0,
  `interestRate` decimal(10,4) DEFAULT NULL,
  `valorTotal` decimal(18,4) DEFAULT NULL,
  `totalWithInterest` decimal(18,4) DEFAULT NULL,
  `balanceAfter` decimal(18,4) DEFAULT NULL,
  `recurrenceType` enum('WEEKLY','BIWEEKLY','MONTHLY','BIMONTHLY','TRIMONTHLY','SEMIANNUALLY') DEFAULT NULL,
  `recorrenciaId` varchar(191) DEFAULT NULL,
  `attachmentUrl` varchar(191) DEFAULT NULL,
  `bankReference` varchar(191) DEFAULT NULL,
  `authorizationCode` varchar(191) DEFAULT NULL,
  `merchantName` varchar(191) DEFAULT NULL,
  `merchantCategory` varchar(191) DEFAULT NULL,
  `counterparty` varchar(191) DEFAULT NULL,
  `postedAt` datetime(3) DEFAULT NULL,
  `clearedAt` datetime(3) DEFAULT NULL,
  `isTransfer` tinyint(1) NOT NULL DEFAULT 0,
  `counterAccountId` varchar(191) DEFAULT NULL,
  `transferGroupId` varchar(191) DEFAULT NULL,
  `isReconciled` tinyint(1) NOT NULL DEFAULT 0,
  `isInvoicePayment` tinyint(1) NOT NULL DEFAULT 0,
  `finalizedGoalId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `accountId` varchar(191) DEFAULT NULL,
  `cardId` varchar(191) DEFAULT NULL,
  `categoryId` varchar(191) DEFAULT NULL,
  `importedTransactionId` varchar(191) DEFAULT NULL,
  `sharedExpenseParticipantId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Transaction_importedTransactionId_key` (`importedTransactionId`),
  UNIQUE KEY `Transaction_sharedExpenseParticipantId_key` (`sharedExpenseParticipantId`),
  KEY `Transaction_recorrenciaId_idx` (`recorrenciaId`),
  KEY `Transaction_installmentId_idx` (`installmentId`),
  KEY `Transaction_userId_data_idx` (`userId`,`data`),
  KEY `Transaction_status_idx` (`status`),
  KEY `Transaction_bankReference_idx` (`bankReference`),
  KEY `Transaction_transferGroupId_idx` (`transferGroupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Transaction`
--

LOCK TABLES `Transaction` WRITE;
/*!40000 ALTER TABLE `Transaction` DISABLE KEYS */;
INSERT INTO `Transaction` VALUES
('cmi7tlgjn000nzrzjxpkn654e',20.0000,'Compra no débito - HORT TGR','despesa','2025-11-11 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m0020zr7fb03mqeee',NULL),
('cmi7tlgjx000pzrzjh5u7fefh',11.9300,'Compra no débito via NuPay - Uber','despesa','2025-11-11 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71m0021zr7flh7s9k6r',NULL),
('cmi7tlgk4000rzrzjbk4pvjcp',2.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-11 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71m0022zr7fphe6we8s',NULL),
('cmi7tlgka000tzrzjcv4dbzus',2.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-11 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71m0023zr7funfvc4jo',NULL),
('cmi7tlgki000vzrzjdvkbgspu',60.0000,'Transferência recebida pelo Pix - ABRAAO BARREIROS DOS REIS - •••.924.707-•• - ITAÚ UNIBANCO S.A. (0341) Agência: 7461 Conta: 17515-5','receita','2025-11-11 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_bares_restaurantes','cmi7tl71m0024zr7fzb2ckzu0',NULL),
('cmi7tlgkj0034zr7f7z6p914c',17.0000,'Compra no débito - HORTITGR','despesa','2025-11-01 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71l000mzr7fkfekbqmc',NULL),
('cmi7tlgkp000xzrzjj5sjlr03',60.0000,'Pagamento de fatura','despesa','2025-11-11 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_lazer_hobbies','cmi7tl71m0025zr7fkgzx4byv',NULL),
('cmi7tlgkr0036zr7fod7t3fpt',119.9000,'Transferência enviada pelo Pix - Claro - 40.432.544/0001-47 - CLARO PAY S.A. IP Agência: 1 Conta: 1872704-2','despesa','2025-11-01 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_assinaturas_servicos','cmi7tl71l000nzr7fkm6zw36b',NULL),
('cmi7tlgkw000zzrzjhm3y0ghi',60.0400,'Transferência recebida pelo Pix - Edson Cantuaria de Azevedo Neto - •••.244.607-•• - MERCADO PAGO IP LTDA. (0323) Agência: 1 Conta: 4537386183-9','receita','2025-11-12 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_mercado','cmi7tl71m0026zr7f3d95qjmi',NULL),
('cmi7tlgkw0038zr7fkv7f13be',217.3600,'Compra no débito - NOVO HORIZONTE COM DE','despesa','2025-11-01 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71l000ozr7fi9otcw11',NULL),
('cmi7tlgl20011zrzjonztu1lo',4.0000,'Compra no débito - HORT TGR','despesa','2025-11-12 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m0027zr7fccogdlif',NULL),
('cmi7tlgl3003azr7fqfdhcxve',3.0000,'Transferência enviada pelo Pix - LIVEPIX - 43.192.126/0001-18 - EFÍ S.A. - IP (0364) Agência: 1 Conta: 314838-6','despesa','2025-11-02 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71l000pzr7fepj0jb9w',NULL),
('cmi7tlgl90013zrzjq05zw7ho',344.0000,'Transferência enviada pelo Pix - Jeanne Magri Vieira - •••.055.327-•• - BCO SANTANDER (BRASIL) S.A. (0033) Agência: 2283 Conta: 1009575-6','despesa','2025-11-12 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m0028zr7fkwk36gc0',NULL),
('cmi7tlgl9003czr7fta25048g',40.0000,'Transferência recebida pelo Pix - ABRAAO BARREIROS DOS REIS - •••.924.707-•• - ITAÚ UNIBANCO S.A. (0341) Agência: 7461 Conta: 17515-5','receita','2025-11-02 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_bares_restaurantes','cmi7tl71l000qzr7fkt3a83qz',NULL),
('cmi7tlglg0015zrzjqxz759wc',2.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-12 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71m0029zr7fxtcmowl5',NULL),
('cmi7tlglg003ezr7fnnecl09k',50.0000,'Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','despesa','2025-11-02 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_lazer_hobbies','cmi7tl71l000rzr7fqotmaey8',NULL),
('cmi7tlglm0017zrzjj1k89a5f',21.0000,'Compra no débito - ELIANE GONCALVES DE FA','despesa','2025-11-12 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m002azr7fiox5hq0b',NULL),
('cmi7tlglm003gzr7fnev6vekj',11.0400,'Transferência enviada pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - ADYEN DO BRASIL IP LTDA. Agência: 1 Conta: 100000015-8','despesa','2025-11-02 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l000szr7fc11ml16g',NULL),
('cmi7tlgls0019zrzjukko8b27',40.0000,'Transferência enviada pelo Pix - NIC. BR - 05.506.560/0001-36 - EFÍ S.A. - IP (0364) Agência: 1 Conta: 276784-8','despesa','2025-11-12 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m002bzr7fj42073j1',NULL),
('cmi7tlgls003izr7fiw1hvgxh',20.6000,'Transferência enviada pelo Pix - 99 FOOD - 60.112.920/0001-23 - ADYEN DO BRASIL IP LTDA. Agência: 1 Conta: 100000197-8','despesa','2025-11-02 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l000tzr7fctpyk3e3',NULL),
('cmi7tlglx003kzr7fpynccrfd',20.6000,'Reembolso recebido pelo Pix - 99 FOOD LTDA. - 60.112.920/0001-23 - ADYEN DO BRASIL IP LTDA. Agência: 1 Conta: 100000197-8','receita','2025-11-02 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l000uzr7fwim5c70i',NULL),
('cmi7tlgly001bzrzj1mkn6fih',8.9900,'Compra no débito via NuPay - iFood','despesa','2025-11-13 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_bares_restaurantes','cmi7tl71m002czr7f42rj4ff4',NULL),
('cmi7tlgm3003mzr7frnhvg2pj',36.7000,'Transferência enviada pelo Pix - 99 FOOD - 60.112.920/0001-23 - ADYEN DO BRASIL IP LTDA. Agência: 1 Conta: 100000197-8','despesa','2025-11-02 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l000vzr7fyok9gsah',NULL),
('cmi7tlgm4001dzrzj4epgq6c3',3.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-13 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71m002dzr7f1m0mgqz9',NULL),
('cmi7tlgm9003ozr7ftle88nwl',57.9700,'Compra no débito via NuPay - iFood','despesa','2025-11-03 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_bares_restaurantes','cmi7tl71l000wzr7fj9eca8uj',NULL),
('cmi7tlgma001fzrzjteghgeel',15.0000,'Aplicação RDB','despesa','2025-11-13 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m002ezr7fz796v8aj',NULL),
('cmi7tlgmf003qzr7ffem9psuy',57.9700,'Estorno - Compra no débito via NuPay - iFood','receita','2025-11-03 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_bares_restaurantes','cmi7tl71l000xzr7fn8mqt42g',NULL),
('cmi7tlgmg001hzrzj2scze1xj',400.0000,'Transferência recebida pelo Pix - ANTONIO ANTUNES PEREIRA NETO - •••.138.207-•• - BCO BRADESCO S.A. (0237) Agência: 2490 Conta: 71505-0','receita','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_outras_receitas','cmi7tl71m002fzr7fi3two80u',NULL),
('cmi7tlgml003szr7fntvfftkp',59.9600,'Compra no débito via NuPay - iFood','despesa','2025-11-03 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_bares_restaurantes','cmi7tl71l000yzr7fkos2e9o9',NULL),
('cmi7tlgmm001jzrzjpkz61uoy',400.0000,'Aplicação RDB','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m002gzr7flc5hphk8',NULL),
('cmi7tlgmr003uzr7f4bqtzfyg',7.5000,'Compra no débito - MP *PADARIATEMTUD','despesa','2025-11-03 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_alimentacao','cmi7tl71l000zzr7f7a4knctx',NULL),
('cmi7tlgms001lzrzjuzwmo1fx',5.5000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71m002hzr7f92e83f0m',NULL),
('cmi7tlgmx003wzr7ffifi509r',200.0000,'Transferência recebida pelo Pix - ANTONIO ANTUNES PEREIRA NETO - •••.138.207-•• - BCO BRADESCO S.A. (0237) Agência: 2490 Conta: 71505-0','receita','2025-11-03 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_outras_receitas','cmi7tl71l0010zr7f664ftgwj',NULL),
('cmi7tlgmz001nzrzjz3ynd9xu',26.0000,'Compra no débito - QDelicia','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m002izr7fiyh099bo',NULL),
('cmi7tlgn4001pzrzjk4p2zh16',4.7500,'Transferência enviada pelo Pix - Giulia de Almeida Teixeira - •••.242.477-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 9314472-3','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_lazer_hobbies','cmi7tl71n002jzr7fxyq5irdz',NULL),
('cmi7tlgn4003yzr7fhwc65x7z',220.0000,'Aplicação RDB','despesa','2025-11-03 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71l0011zr7fqobzrd09',NULL),
('cmi7tlgn90040zr7fhzb01px8',6.5000,'Compra no débito - MARCELLO GERHARDT LOUZ','despesa','2025-11-03 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71l0012zr7fafdq1tng',NULL),
('cmi7tlgnb001rzrzjl4qlmbbv',2.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71n002kzr7fysi420mn',NULL),
('cmi7tlgng001tzrzjch1fcebk',3.0000,'Transferência enviada pelo Pix - Giulia de Almeida Teixeira - •••.242.477-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 9314472-3','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_lazer_hobbies','cmi7tl71n002lzr7f3c5az7lo',NULL),
('cmi7tlgng0042zr7ff7u2gssj',20.3000,'Compra no débito - MP *AVEIGADESCART','despesa','2025-11-03 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71l0013zr7fkk4pdy3s',NULL),
('cmi7tlgnm001vzrzjhpeu5egp',3.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71n002mzr7fh6hyg4rd',NULL),
('cmi7tlgnn0044zr7f7pjr40c7',2.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-03 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l0014zr7f7fp8jlcn',NULL),
('cmi7tlgnr001xzrzj247g9w43',30.0000,'Compra no débito - VetsTecnologia','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71n002nzr7fshrccohj',NULL),
('cmi7tlgnt0046zr7fhg8bmx5e',4.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-03 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l0015zr7f2c1bfehm',NULL),
('cmi7tlgnx001zzrzj3plk1qxb',15.0000,'Compra no débito - VetsTecnologia','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71n002ozr7fye8va511',NULL),
('cmi7tlgnz0048zr7fhx0k8gyo',53.0600,'Transferência enviada pelo Pix - 99 FOOD - 60.112.920/0001-23 - ADYEN DO BRASIL IP LTDA. Agência: 1 Conta: 100000197-8','despesa','2025-11-03 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l0016zr7fr8hcc4co',NULL),
('cmi7tlgo30021zrzjq9fspwwa',30.0000,'Compra no débito - VetsTecnologia','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71n002pzr7fnon67tv8',NULL),
('cmi7tlgo4004azr7f72riusk7',6.6300,'Transferência enviada pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - BANCO BTG PACTUAL S.A. (0208) Agência: 30 Conta: 571873-6','despesa','2025-11-04 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l0017zr7fiof8sj4q',NULL),
('cmi7tlgo80023zrzjxg282gtn',10.0000,'Compra no débito - REVITALE IMPORT','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71n002qzr7ff37howd1',NULL),
('cmi7tlgoa004czr7fnatwy4m6',3.5000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-04 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l0018zr7foamul4ld',NULL),
('cmi7tlgoe0025zrzjzru89t8z',30.0000,'Compra no débito - VetsTecnologia','despesa','2025-11-14 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71n002rzr7ft56fj4er',NULL),
('cmi7tlgog004ezr7fpid419dr',6.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-04 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l0019zr7fglizuoa8',NULL),
('cmi7tlgok0027zrzjbtkkac4g',20.0000,'Resgate RDB','receita','2025-11-15 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_outras_receitas','cmi7tl71n002szr7fnk9aennw',NULL),
('cmi7tlgom004gzr7fuqzt2xvt',4.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-04 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l001azr7f7ablomnd',NULL),
('cmi7tlgoq0029zrzjogfcobvw',85.0000,'Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','despesa','2025-11-15 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_lazer_hobbies','cmi7tl71n002tzr7f9k2cs70i',NULL),
('cmi7tlgos004izr7fw1iibnuf',22.9800,'Compra no débito via NuPay - iFood','despesa','2025-11-05 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_bares_restaurantes','cmi7tl71l001bzr7fag4zfy6z',NULL),
('cmi7tlgow002bzrzj6h1v8h28',2.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-15 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71n002uzr7fsh144i4y',NULL),
('cmi7tlgoy004kzr7fwxdi45jo',5.5000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-05 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l001czr7fau02vlwn',NULL),
('cmi7tlgp2002dzrzjxss9i655',200.0000,'Transferência recebida pelo Pix - ANTONIO ANTUNES PEREIRA NETO - •••.138.207-•• - ITAÚ UNIBANCO S.A. (0341) Agência: 7333 Conta: 31620-1','receita','2025-11-15 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_outras_receitas','cmi7tl71n002vzr7fgtobkjuz',NULL),
('cmi7tlgp4004mzr7frcvqj768',2.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-05 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l001dzr7f621pgox2',NULL),
('cmi7tlgp9002fzrzj74jldyfd',200.0000,'Aplicação RDB','despesa','2025-11-15 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71n002wzr7fu77jr0xn',NULL),
('cmi7tlgpb004ozr7fp5ms7edy',3142.4500,'Transferência recebida pelo Pix via Open Banking - EDSON CANTUARIA DE AZEVEDO NETO - •••.244.607-•• - BCO SANTANDER (BRASIL) S.A. (0033) Agência: 2969 Conta: 3033985-7','receita','2025-11-05 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_outras_receitas','cmi7tl71l001ezr7fuaxwajax',NULL),
('cmi7tlgpf002hzrzj2mrk33oa',2.6000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-17 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71n002xzr7fwnu86t2s',NULL),
('cmi7tlgpg004qzr7fl4q47e9f',1229.2000,'Pagamento de fatura','despesa','2025-11-05 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_lazer_hobbies','cmi7tl71l001fzr7fpwmw2roa',NULL),
('cmi7tlgpm002jzrzj7w0s1gvm',2.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-17 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71n002yzr7frs8ef1m6',NULL),
('cmi7tlgpm004szr7f6f6i9gu8',800.0000,'Transferência enviada pelo Pix - GABRIEL MAGRI TOSATTO - •••.324.547-•• - BANCO INTER (0077) Agência: 1 Conta: 12847069-0','despesa','2025-11-05 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71l001gzr7f2q8e5xzs',NULL),
('cmi7tlgps002lzrzjn1o1ct01',3.6000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-18 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71n002zzr7ftv3tz19g',NULL),
('cmi7tlgpt004uzr7f9msp46p4',150.0000,'Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','despesa','2025-11-05 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_lazer_hobbies','cmi7tl71l001hzr7fmllty5td',NULL),
('cmi7tlgpz002nzrzjn40pay72',3.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-18 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71n0030zr7fi3j1uwzu',NULL),
('cmi7tlgq0004wzr7f04rmogo1',200.0000,'Aplicação RDB','despesa','2025-11-05 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71l001izr7f8tznbj1t',NULL),
('cmi7tlgq5002pzrzjf5o5ow9y',2.3000,'Valor adicionado na conta por cartão de crédito - Valor adicionado para Pix no Crédito','receita','2025-11-18 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_outras_receitas','cmi7tl71n0031zr7fd4tt1ki2',NULL),
('cmi7tlgq6004yzr7fy50x1psk',20.0000,'Recarga de celular','despesa','2025-11-06 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71l001jzr7fdn3x292e',NULL),
('cmi7tlgqb002rzrzjfyhno62b',2.3000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-18 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71n0032zr7fig9wq5t3',NULL),
('cmi7tlgqd0050zr7fiwstu49d',24.9900,'Compra no débito via NuPay - iFood','despesa','2025-11-06 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_bares_restaurantes','cmi7tl71m001kzr7fgwcov8ih',NULL),
('cmi7tlgqj0052zr7fdgz9hkrr',40.0000,'Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','despesa','2025-11-06 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_lazer_hobbies','cmi7tl71m001lzr7f6aqhrts6',NULL),
('cmi7tlgqq0054zr7fro3ckwq6',2.0000,'Transferência enviada pelo Pix - Natália Andrade da Silva - •••.282.457-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 19972795-0','despesa','2025-11-06 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71m001mzr7f1tmdvg30',NULL),
('cmi7tlgqv0056zr7fno1b4ttd',16.9700,'Compra no débito - NOVO HORIZONTE COM DE','despesa','2025-11-07 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m001nzr7f0ador56h',NULL),
('cmi7tlgr00058zr7ffqura0ds',14.0000,'Compra no débito - HORT TGR','despesa','2025-11-07 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m001ozr7f0gvoc6tw',NULL),
('cmi7tlgr6005azr7fk2xjv9pn',14.9000,'Transferência enviada pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - BANCO BTG PACTUAL S.A. (0208) Agência: 30 Conta: 571873-6','despesa','2025-11-08 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71m001pzr7fphw0z764',NULL),
('cmi7tlgrb005czr7fnrvrce8o',6.0000,'Compra no débito - HORT TGR','despesa','2025-11-08 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m001qzr7fsir6flz1',NULL),
('cmi7tlgrh005ezr7flk8r3nlk',52.0400,'Compra no débito - NOVO HORIZONTE COM DE','despesa','2025-11-08 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m001rzr7f1e94rwp8',NULL),
('cmi7tlgrm005gzr7fe43zh34r',11.3700,'Transferência enviada pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - BANCO BTG PACTUAL S.A. (0208) Agência: 30 Conta: 292948-0','despesa','2025-11-08 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71m001szr7f3kqk2hsz',NULL),
('cmi7tlgrs005izr7fsaj3en4d',100.0000,'Compra no débito - ELIANE GONCALVES DE FA','despesa','2025-11-08 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_compras','cmi7tl71m001tzr7f9w2cyzvt',NULL),
('cmi7tlgrx005kzr7fdfbm87nj',8.4000,'Transferência enviada pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - BANCO BTG PACTUAL S.A. (0208) Agência: 30 Conta: 292948-0','despesa','2025-11-08 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71m001uzr7fbi1br7g5',NULL),
('cmi7tlgs4005mzr7fifoqyrte',3.0700,'Reembolso recebido pelo Pix - 99 TECNOLOGIA LTDA - 18.033.552/0001-61 - BANCO BTG PACTUAL S.A. (0208) Agência: 30 Conta: 292948-0','receita','2025-11-08 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_transporte','cmi7tl71m001vzr7fhkkettwy',NULL),
('cmi7tlgs8005ozr7fza3uaiwg',50.0000,'Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','despesa','2025-11-08 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_lazer_hobbies','cmi7tl71m001wzr7fp6y09r56',NULL),
('cmi7tlgsc005qzr7f3jekxkvs',100.0000,'Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','despesa','2025-11-09 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_lazer_hobbies','cmi7tl71m001xzr7f8kmm4pic',NULL),
('cmi7tlgsg005szr7f59ttmxvj',40.0000,'Transferência enviada pelo Pix - Edson Cantuaria de Azevedo Neto - •••.244.607-•• - MERCADO PAGO IP LTDA. (0323) Agência: 1 Conta: 4537386183-9','despesa','2025-11-10 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_mercado','cmi7tl71m001yzr7fnuuabxwe',NULL),
('cmi7tlgsk005uzr7fj99akg5l',20.0000,'Transferência enviada pelo Pix - Sthefany Paixão Oliveira - •••.381.867-•• - NU PAGAMENTOS - IP (0260) Agência: 1 Conta: 57218962-0','despesa','2025-11-11 03:00:00.000','debito','BRL','POSTED',1,NULL,0,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,1,0,NULL,'cmi7b69q20000zrs7cvqaxass','cmi7f7ob00007zr401izjwx58',NULL,'cat_lazer_hobbies','cmi7tl71m001zzr7fuh3m5rse',NULL),
('cmi8560x3000izrm1jpo7x8eq',20.0000,'Ifood','despesa','2025-11-21 00:48:07.201','pix','BRL','POSTED',1,'',0,NULL,NULL,2,0,0.0000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,0,NULL,'cmi853w170000zrm1zzvlkdn3','cmi854ddt0008zrm1660pswx7',NULL,'cat_alimentacao',NULL,NULL);
/*!40000 ALTER TABLE `Transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UnlockedAchievement`
--

DROP TABLE IF EXISTS `UnlockedAchievement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `UnlockedAchievement` (
  `id` varchar(191) NOT NULL,
  `destacada` tinyint(1) NOT NULL DEFAULT 0,
  `unlockedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  `achievementId` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UnlockedAchievement_userId_achievementId_key` (`userId`,`achievementId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UnlockedAchievement`
--

LOCK TABLES `UnlockedAchievement` WRITE;
/*!40000 ALTER TABLE `UnlockedAchievement` DISABLE KEYS */;
INSERT INTO `UnlockedAchievement` VALUES
('cmi7f82gt000bzr40l9c37eou',0,'2025-11-20 12:42:06.077','cmi7b69q20000zrs7cvqaxass','clz7w4h210002or01g2d3h4j5'),
('cmi855ilx000czrm1lz2g6i30',0,'2025-11-21 00:47:57.045','cmi853w170000zrm1zzvlkdn3','clz7w4h210002or01g2d3h4j5');
/*!40000 ALTER TABLE `UnlockedAchievement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `username` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` varchar(191) DEFAULT NULL,
  `avatarUrl` varchar(191) DEFAULT NULL,
  `role` enum('USER','ADMIN') NOT NULL DEFAULT 'USER',
  `isAdmin` tinyint(1) NOT NULL DEFAULT 0,
  `firstOpen` tinyint(1) NOT NULL DEFAULT 1,
  `futureProjectionCount` int(11) NOT NULL DEFAULT 3,
  `daysUntilDueReminder` int(11) NOT NULL DEFAULT 3,
  `enableAchievementNotifications` tinyint(1) NOT NULL DEFAULT 1,
  `enableBudgetNotifications` tinyint(1) NOT NULL DEFAULT 1,
  `enableLimitAlerts` tinyint(1) NOT NULL DEFAULT 1,
  `enableUpcomingPaymentNotifications` tinyint(1) NOT NULL DEFAULT 1,
  `enableOcr` tinyint(1) NOT NULL DEFAULT 0,
  `enableDailySummary` tinyint(1) NOT NULL DEFAULT 0,
  `enableBudgetSuggestion` tinyint(1) NOT NULL DEFAULT 0,
  `enableReconciliationAi` tinyint(1) NOT NULL DEFAULT 0,
  `enableGoalProjection` tinyint(1) NOT NULL DEFAULT 0,
  `habilitarDescricaoInteligente` tinyint(1) NOT NULL DEFAULT 1,
  `dashboardLayout` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dashboardLayout`)),
  `professionalSituation` varchar(191) DEFAULT NULL,
  `monthlyIncomeRange` varchar(191) DEFAULT NULL,
  `investmentProfile` varchar(191) DEFAULT NULL,
  `mainFinancialGoal` varchar(191) DEFAULT NULL,
  `fixedMonthlyIncome` decimal(18,2) DEFAULT NULL,
  `phoneNumber` varchar(191) DEFAULT NULL,
  `phoneVerified` tinyint(1) NOT NULL DEFAULT 0,
  `twoFactorEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `twoFactorSecret` varchar(191) DEFAULT NULL,
  `favoriteCategories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`favoriteCategories`)),
  `dashboardPreferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dashboardPreferences`)),
  `hideFamilyMode` tinyint(1) NOT NULL DEFAULT 0,
  `lastSecurityNotificationAt` datetime(3) DEFAULT NULL,
  `pushSubscription` text DEFAULT NULL,
  `gamificationMode` enum('FULL','LITE','OFF') NOT NULL DEFAULT 'FULL',
  `level` int(11) NOT NULL DEFAULT 1,
  `xp` int(11) NOT NULL DEFAULT 0,
  `heroClass` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `lastWeeklyReset` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `weeklyXp` int(11) NOT NULL DEFAULT 0,
  `hasCompletedTutorial` tinyint(1) NOT NULL DEFAULT 0,
  `emailVerificationExpires` datetime(3) DEFAULT NULL,
  `emailVerificationToken` varchar(191) DEFAULT NULL,
  `emailVerified` tinyint(1) NOT NULL DEFAULT 0,
  `resetPasswordExpires` datetime(3) DEFAULT NULL,
  `resetPasswordToken` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_username_key` (`username`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES
('cmi7b69q20000zrs7cvqaxass','Edson Cantuaria','edson','edsoncantuaria@outlook.com','$2a$10$lYMvWFE.0jU7NB6XTr1yL.Lan0UbXax0sc0f6FTBi.7WBpPn./VT.',NULL,NULL,'cmi7b69q20000zrs7cvqaxass/56d4a6d124286953eaaa8729c59d4acf.png','USER',0,0,3,3,1,1,1,1,0,0,0,0,0,1,'[]',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,'[]','{}',0,'2025-11-20 20:38:56.880',NULL,'FULL',2,5,'Cidadão Comum','2025-11-20 10:48:43.706','2025-11-21 13:08:38.714','2025-11-20 21:38:26.313',0,1,NULL,NULL,0,NULL,NULL),
('cmi7jmb9o0000zrz7st9k10iw','Teste','teste','teste@exemplo.com','$2a$10$stCg4RVvxeLmXlcvWMVYpeBI1BBjV15ixLMirQKieApaBjTSWOC4.',NULL,NULL,NULL,'USER',0,0,3,3,1,1,1,1,0,0,0,0,0,1,'[]',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,'[]','{}',0,NULL,NULL,'OFF',1,0,NULL,'2025-11-20 14:45:09.133','2025-11-20 14:45:58.483','2025-11-20 21:38:26.313',0,0,NULL,NULL,0,NULL,NULL),
('cmi7wk3g10006zrmqkcx8fzac','Gabriela Holler de Andrade','gabiholler','biholler@yahoo.com.br','$2a$10$5tITxRnHAHogYTtzyutEC.HVePPomiBpjv8B1VaPgUXGkQlF6SIxG',NULL,NULL,NULL,'USER',0,0,3,3,1,1,1,1,0,0,0,0,0,1,'[]',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,'[]','{}',0,NULL,NULL,'FULL',1,0,NULL,'2025-11-20 20:47:20.689','2025-11-20 20:49:01.128','2025-11-20 21:38:26.313',0,0,NULL,NULL,0,NULL,NULL),
('cmi853w170000zrm1zzvlkdn3','Miguel Gilberto','miguel','Miguel@gmail.com','$2a$10$4qfbvDsfipk040r6D9sVEO5oMjEx4jciNpUA6OJVYS.gefPCYiRPa',NULL,NULL,NULL,'USER',0,0,3,3,1,1,1,1,0,0,0,0,0,1,'[]',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,'[]','{}',0,NULL,NULL,'FULL',2,51,'Aprendiz Equilibrado','2025-11-21 00:46:41.132','2025-11-21 02:22:11.763','2025-11-21 00:46:41.132',151,0,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserItem`
--

DROP TABLE IF EXISTS `UserItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserItem` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `itemId` varchar(191) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `equipped` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserItem_userId_itemId_key` (`userId`,`itemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserItem`
--

LOCK TABLES `UserItem` WRITE;
/*!40000 ALTER TABLE `UserItem` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserItem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserMission`
--

DROP TABLE IF EXISTS `UserMission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserMission` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `missionId` varchar(191) NOT NULL,
  `acceptedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `progressJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`progressJson`)),
  `completedAt` datetime(3) DEFAULT NULL,
  `rewardClaimed` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserMission_userId_missionId_key` (`userId`,`missionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserMission`
--

LOCK TABLES `UserMission` WRITE;
/*!40000 ALTER TABLE `UserMission` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserMission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserStreak`
--

DROP TABLE IF EXISTS `UserStreak`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserStreak` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `type` enum('DAILY_TRANSACTION','NO_VICE_SPENDING') NOT NULL,
  `currentStreak` int(11) NOT NULL DEFAULT 0,
  `longestStreak` int(11) NOT NULL DEFAULT 0,
  `lastCheckedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserStreak_userId_type_key` (`userId`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserStreak`
--

LOCK TABLES `UserStreak` WRITE;
/*!40000 ALTER TABLE `UserStreak` DISABLE KEYS */;
INSERT INTO `UserStreak` VALUES
('cmi7eljti0001zrg3g2z2luw8','cmi7b69q20000zrs7cvqaxass','NO_VICE_SPENDING',1,2,'2025-11-21 15:08:59.017'),
('cmi7v7bw10003zr9wn58odi6a','cmi7jmb9o0000zrz7st9k10iw','NO_VICE_SPENDING',1,2,'2025-11-21 15:08:59.050'),
('cmi84ul1n0003zrsinvb607t2','cmi7wk3g10006zrmqkcx8fzac','NO_VICE_SPENDING',1,2,'2025-11-21 15:08:59.010'),
('cmi85tmkf0005zrv29a53pvdi','cmi853w170000zrm1zzvlkdn3','NO_VICE_SPENDING',1,2,'2025-11-21 15:08:59.033'),
('cmi8a872i000hzrodg3zx01rj','cmi853w170000zrm1zzvlkdn3','DAILY_TRANSACTION',1,1,'2025-11-21 15:08:59.019');
/*!40000 ALTER TABLE `UserStreak` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_TagToTransaction`
--

DROP TABLE IF EXISTS `_TagToTransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_TagToTransaction` (
  `A` varchar(191) NOT NULL,
  `B` varchar(191) NOT NULL,
  UNIQUE KEY `_TagToTransaction_AB_unique` (`A`,`B`),
  KEY `_TagToTransaction_B_index` (`B`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_TagToTransaction`
--

LOCK TABLES `_TagToTransaction` WRITE;
/*!40000 ALTER TABLE `_TagToTransaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `_TagToTransaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES
('508e027d-67d2-4331-b9c7-5f8e1a341ceb','3c1d75e2511f96963554fd469ceccb8e602d47faff54d5df134aa5fe3393f892','2025-11-20 02:29:24.552','20251119120000_add_equilibrium_settlements',NULL,NULL,'2025-11-20 02:29:24.523',1),
('54d26750-ac0a-4dc1-b61c-daf3702e6c40','3c1634afa8a7c58f38c38bb8e11720d5ddb18b0a82f289cc6cf7d0252587fac8','2025-11-20 02:29:24.803','20251120013258_nw',NULL,NULL,'2025-11-20 02:29:24.792',1),
('83534f70-ce34-4e24-a3cc-cad5f1235f09','2743a7a351f346c6477d6b85eac09184aee7523b1941d6af30384619b289758e','2025-11-20 02:50:13.778','20251120025013_invest_go_l',NULL,NULL,'2025-11-20 02:50:13.766',1),
('8a655de0-d150-421e-98a0-5056e8e1a2a9','d18e0e592f7abe487b22133be3afd74e2d50783184e8f670f3159e1aeb65aa61','2025-11-20 02:29:24.778','20251119232805_reconciliacao',NULL,NULL,'2025-11-20 02:29:24.765',1),
('9e4c4f89-03c7-42a0-823e-397e87bd5ff5','344e29f2106fd090bf9367584f53142939627b079a8ec2fe0b20f1d4c21a0ec4','2025-11-20 02:29:24.743','20251119124500_adjust_equilibrium_settlements',NULL,NULL,'2025-11-20 02:29:24.631',1),
('a11edeb1-022f-4316-b4c4-afbe61e8d310','197014fdcaa8a013aeddaa1a7175986279b584a55c479f633de757abb5e8a3fd','2025-11-20 02:29:24.519','20251118190058_init',NULL,NULL,'2025-11-20 02:29:23.685',1),
('affa5dcc-fbe8-47db-88bd-cc59c737b1af','81c9ac6fe90e43c3991dd8eceac9f722c0b590a8c3137c429de8768094fba800','2025-11-20 02:29:24.832','20251120120000_investment_module',NULL,NULL,'2025-11-20 02:29:24.817',1),
('b2759993-6591-4fe2-9ef2-fe451f30aa6e','f76d46f2c5f3c8a3a5df1924449fb35f864bf646dde18247e8245442a6860102','2025-11-20 02:29:24.853','20251120152000_investment_goal_link',NULL,NULL,'2025-11-20 02:29:24.839',1),
('b62353ee-bbca-4b57-9e3e-1e290cf353c9','647ddf40abe66c0ac8bfe0aa99d96c713b87a10b5b2fd1f85454d3237a15b31f','2025-11-20 02:29:24.816','20251120020657_invetstime',NULL,NULL,'2025-11-20 02:29:24.815',1),
('bcbdc8db-c7f1-458a-89ff-b761f8364c5d','72aad11c7131cfb1f81e41371fb2dc4ec8fa067c2c7dd3d787339aaa116734ec','2025-11-20 02:29:24.814','20251120013624_npx_prisma_generate',NULL,NULL,'2025-11-20 02:29:24.804',1),
('c2820667-0b01-401f-8798-2590becaf463','295870cefaf94ccbc48aa5de8bb7f3e409ee26eb7c91574d03c355748fbc192e','2025-11-20 02:29:24.792','20251119233715_reconciliation_balances',NULL,NULL,'2025-11-20 02:29:24.779',1),
('dae4abed-c8c7-47e7-a77d-dfa6b7cea00f','a7ea96fd5859c240834202dfc034c826a22b6360761543de23d5852a631cc2f5','2025-11-20 02:29:24.764','20251119140000_shared_expense_fields',NULL,NULL,'2025-11-20 02:29:24.743',1),
('e72e42d5-f668-45a2-9c5a-b8637d245bca','7f5c93fb02c62a98178efde599e2dc1b74cfca9a4da635d666659eaae6a8a8cb','2025-11-20 02:29:24.838','20251120150000_investment_metrics',NULL,NULL,'2025-11-20 02:29:24.833',1),
('efe23ae6-6e33-4f65-ac98-e2fc7d263fa3','5cf709fc8d013ca9c587894b083a231f52a5132cd4cb2610908752ccf7c2c8ac','2025-11-20 02:29:24.630','20251119123500_link_funds_goals',NULL,NULL,'2025-11-20 02:29:24.554',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_budgets`
--

DROP TABLE IF EXISTS `cell_budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_budgets` (
  `id` varchar(191) NOT NULL,
  `cellId` varchar(191) NOT NULL,
  `categoryId` varchar(191) DEFAULT NULL,
  `label` varchar(191) DEFAULT NULL,
  `type` enum('CELL','HYBRID','PERSONAL') NOT NULL DEFAULT 'CELL',
  `recurrenceType` enum('MONTHLY','WEEKLY','BIWEEKLY','CUSTOM') NOT NULL DEFAULT 'MONTHLY',
  `recurrenceDays` int(11) DEFAULT NULL,
  `splitConfig` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`splitConfig`)),
  `fundId` varchar(191) DEFAULT NULL,
  `limit` decimal(18,4) NOT NULL,
  `effectiveFrom` datetime(3) DEFAULT NULL,
  `effectiveTo` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `lastSyncedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cell_budgets_cellId_idx` (`cellId`),
  KEY `cell_budgets_cellId_type_idx` (`cellId`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_budgets`
--

LOCK TABLES `cell_budgets` WRITE;
/*!40000 ALTER TABLE `cell_budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `cell_budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_equilibrium_settlements`
--

DROP TABLE IF EXISTS `cell_equilibrium_settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_equilibrium_settlements` (
  `id` varchar(191) NOT NULL,
  `cellId` varchar(191) NOT NULL,
  `payerId` varchar(191) NOT NULL,
  `receiverId` varchar(191) NOT NULL,
  `amount` decimal(18,4) NOT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `referenceMonth` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `cell_equilibrium_settlements_cellId_idx` (`cellId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_equilibrium_settlements`
--

LOCK TABLES `cell_equilibrium_settlements` WRITE;
/*!40000 ALTER TABLE `cell_equilibrium_settlements` DISABLE KEYS */;
/*!40000 ALTER TABLE `cell_equilibrium_settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_equilibrium_snapshots`
--

DROP TABLE IF EXISTS `cell_equilibrium_snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_equilibrium_snapshots` (
  `id` varchar(191) NOT NULL,
  `cellId` varchar(191) NOT NULL,
  `referenceMonth` varchar(191) NOT NULL,
  `summary` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`summary`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cell_equilibrium_snapshots_cellId_referenceMonth_key` (`cellId`,`referenceMonth`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_equilibrium_snapshots`
--

LOCK TABLES `cell_equilibrium_snapshots` WRITE;
/*!40000 ALTER TABLE `cell_equilibrium_snapshots` DISABLE KEYS */;
/*!40000 ALTER TABLE `cell_equilibrium_snapshots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_events`
--

DROP TABLE IF EXISTS `cell_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_events` (
  `id` varchar(191) NOT NULL,
  `cellId` varchar(191) NOT NULL,
  `actorId` varchar(191) DEFAULT NULL,
  `type` varchar(191) NOT NULL,
  `title` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `entityId` varchar(191) DEFAULT NULL,
  `entityType` varchar(191) DEFAULT NULL,
  `visibility` varchar(191) NOT NULL DEFAULT 'CELL',
  `sourceAuditLogId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cell_events_sourceAuditLogId_key` (`sourceAuditLogId`),
  KEY `cell_events_cellId_createdAt_idx` (`cellId`,`createdAt`),
  KEY `cell_events_entityId_entityType_idx` (`entityId`,`entityType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_events`
--

LOCK TABLES `cell_events` WRITE;
/*!40000 ALTER TABLE `cell_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `cell_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_expense_splits`
--

DROP TABLE IF EXISTS `cell_expense_splits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_expense_splits` (
  `id` varchar(191) NOT NULL,
  `sharedExpenseId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `amountOwed` decimal(18,4) NOT NULL,
  `createdTransactionId` varchar(191) NOT NULL,
  `defaultAccountId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cell_expense_splits_createdTransactionId_key` (`createdTransactionId`),
  UNIQUE KEY `cell_expense_splits_sharedExpenseId_userId_key` (`sharedExpenseId`,`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_expense_splits`
--

LOCK TABLES `cell_expense_splits` WRITE;
/*!40000 ALTER TABLE `cell_expense_splits` DISABLE KEYS */;
/*!40000 ALTER TABLE `cell_expense_splits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_expenses`
--

DROP TABLE IF EXISTS `cell_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_expenses` (
  `id` varchar(191) NOT NULL,
  `clanId` varchar(191) NOT NULL,
  `creatorId` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `totalAmount` decimal(18,4) NOT NULL,
  `splitMethod` enum('EQUAL','PERCENTAGE','AMOUNT') NOT NULL,
  `categoryId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `splitAppliedAt` datetime(3) DEFAULT NULL,
  `expenseDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_expenses`
--

LOCK TABLES `cell_expenses` WRITE;
/*!40000 ALTER TABLE `cell_expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `cell_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_fund_contributions`
--

DROP TABLE IF EXISTS `cell_fund_contributions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_fund_contributions` (
  `id` varchar(191) NOT NULL,
  `fundId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `amount` decimal(18,4) NOT NULL,
  `source` varchar(191) DEFAULT NULL,
  `fromBudgetId` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `cell_fund_contributions_fundId_createdAt_idx` (`fundId`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_fund_contributions`
--

LOCK TABLES `cell_fund_contributions` WRITE;
/*!40000 ALTER TABLE `cell_fund_contributions` DISABLE KEYS */;
/*!40000 ALTER TABLE `cell_fund_contributions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_funds`
--

DROP TABLE IF EXISTS `cell_funds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_funds` (
  `id` varchar(191) NOT NULL,
  `cellId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `targetAmount` decimal(18,4) NOT NULL,
  `currentAmount` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `usagePolicy` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`usagePolicy`)),
  `custodianId` varchar(191) DEFAULT NULL,
  `custodianAccountLabel` varchar(191) DEFAULT NULL,
  `depositInstructions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`depositInstructions`)),
  `withdrawalRoles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`withdrawalRoles`)),
  `mirrorToCustodian` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('ACTIVE','PAUSED','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  `goalDeadline` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cell_funds_cellId_idx` (`cellId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_funds`
--

LOCK TABLES `cell_funds` WRITE;
/*!40000 ALTER TABLE `cell_funds` DISABLE KEYS */;
/*!40000 ALTER TABLE `cell_funds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_invites`
--

DROP TABLE IF EXISTS `cell_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_invites` (
  `id` varchar(191) NOT NULL,
  `clanId` varchar(191) NOT NULL,
  `invitedUserId` varchar(191) NOT NULL,
  `inviterId` varchar(191) NOT NULL,
  `status` enum('PENDING','ACCEPTED','DECLINED') NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expiresAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cell_invites_clanId_invitedUserId_key` (`clanId`,`invitedUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_invites`
--

LOCK TABLES `cell_invites` WRITE;
/*!40000 ALTER TABLE `cell_invites` DISABLE KEYS */;
/*!40000 ALTER TABLE `cell_invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_members`
--

DROP TABLE IF EXISTS `cell_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_members` (
  `userId` varchar(191) NOT NULL,
  `clanId` varchar(191) NOT NULL,
  `role` enum('LEADER','ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER',
  `joinedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `permissions_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions_json`)),
  PRIMARY KEY (`userId`,`clanId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_members`
--

LOCK TABLES `cell_members` WRITE;
/*!40000 ALTER TABLE `cell_members` DISABLE KEYS */;
INSERT INTO `cell_members` VALUES
('cmi7b69q20000zrs7cvqaxass','cmi7vnt7p0001zr9xw9337asz','LEADER','2025-11-20 20:22:14.440','{}');
/*!40000 ALTER TABLE `cell_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_shared_accounts`
--

DROP TABLE IF EXISTS `cell_shared_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_shared_accounts` (
  `id` varchar(191) NOT NULL,
  `cellId` varchar(191) NOT NULL,
  `accountId` varchar(191) NOT NULL,
  `visibility` enum('MEMBERS','ADMINS','CUSTOM') NOT NULL DEFAULT 'MEMBERS',
  `allowedRoles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`allowedRoles`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cell_shared_accounts_cellId_accountId_key` (`cellId`,`accountId`),
  KEY `cell_shared_accounts_cellId_idx` (`cellId`),
  KEY `cell_shared_accounts_accountId_idx` (`accountId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_shared_accounts`
--

LOCK TABLES `cell_shared_accounts` WRITE;
/*!40000 ALTER TABLE `cell_shared_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `cell_shared_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cell_split_rules`
--

DROP TABLE IF EXISTS `cell_split_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cell_split_rules` (
  `id` varchar(191) NOT NULL,
  `cellId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `trigger` enum('RECURRING_BILL','ADHOC','USAGE_BASED') NOT NULL DEFAULT 'ADHOC',
  `method` enum('EQUAL','WEIGHTED','CONSUMPTION','PAYER_REIMBURSED') NOT NULL DEFAULT 'EQUAL',
  `weightsConfig` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`weightsConfig`)),
  `consumptionMetric` varchar(191) DEFAULT NULL,
  `autoReimburse` tinyint(1) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cell_split_rules_cellId_active_idx` (`cellId`,`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cell_split_rules`
--

LOCK TABLES `cell_split_rules` WRITE;
/*!40000 ALTER TABLE `cell_split_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `cell_split_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `family_cells`
--

DROP TABLE IF EXISTS `family_cells`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `family_cells` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `iconUrl` varchar(191) DEFAULT NULL,
  `balance` decimal(18,4) NOT NULL DEFAULT 0.0000,
  `level` int(11) NOT NULL DEFAULT 1,
  `xp` bigint(20) NOT NULL DEFAULT 0,
  `policies` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`policies`)),
  `maxMembers` int(11) NOT NULL DEFAULT 50,
  `leaderId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `family_cells_name_key` (`name`),
  UNIQUE KEY `family_cells_leaderId_key` (`leaderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `family_cells`
--

LOCK TABLES `family_cells` WRITE;
/*!40000 ALTER TABLE `family_cells` DISABLE KEYS */;
INSERT INTO `family_cells` VALUES
('cmi7vnt7p0001zr9xw9337asz','familia',NULL,NULL,0.0000,1,0,NULL,50,'cmi7b69q20000zrs7cvqaxass','2025-11-20 20:22:14.437','2025-11-20 20:22:14.437');
/*!40000 ALTER TABLE `family_cells` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_events`
--

DROP TABLE IF EXISTS `security_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_events` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `type` enum('NEW_DEVICE','PASSWORD_RESET','TWO_FACTOR_CHALLENGE') NOT NULL,
  `message` varchar(191) NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `security_events_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_events`
--

LOCK TABLES `security_events` WRITE;
/*!40000 ALTER TABLE `security_events` DISABLE KEYS */;
INSERT INTO `security_events` VALUES
('cmi7b69wl0004zrs7v4ofclhb','cmi7b69q20000zrs7cvqaxass','NEW_DEVICE','Novo login no dispositivo Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','{\"platform\":\"web\",\"ipAddress\":\"::ffff:127.0.0.1\"}','2025-11-20 10:48:43.941'),
('cmi7em1w20003zr409b3cp969','cmi7b69q20000zrs7cvqaxass','NEW_DEVICE','Novo login no dispositivo Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','{\"platform\":\"web\",\"ipAddress\":\"::ffff:127.0.0.1\"}','2025-11-20 12:24:58.898'),
('cmi7jmbew0004zrz7uayeqq2w','cmi7jmb9o0000zrz7st9k10iw','NEW_DEVICE','Novo login no dispositivo Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','{\"platform\":\"web\",\"ipAddress\":\"::ffff:127.0.0.1\"}','2025-11-20 14:45:09.320'),
('cmi7w9apa0003zrmq19wd98v4','cmi7b69q20000zrs7cvqaxass','NEW_DEVICE','Novo login no dispositivo Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36','{\"platform\":\"web\",\"ipAddress\":\"::ffff:127.0.0.1\"}','2025-11-20 20:38:56.879'),
('cmi7wk3p1000azrmqtjmoqu4i','cmi7wk3g10006zrmqkcx8fzac','NEW_DEVICE','Novo login no dispositivo Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1','{\"platform\":\"web\",\"ipAddress\":\"::ffff:127.0.0.1\"}','2025-11-20 20:47:21.014'),
('cmi853w740004zrm14kidkazs','cmi853w170000zrm1zzvlkdn3','NEW_DEVICE','Novo login no dispositivo Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','{\"platform\":\"web\",\"ipAddress\":\"::ffff:127.0.0.1\"}','2025-11-21 00:46:41.345');
/*!40000 ALTER TABLE `security_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_devices`
--

DROP TABLE IF EXISTS `user_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_devices` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `deviceId` varchar(191) NOT NULL,
  `deviceName` varchar(191) DEFAULT NULL,
  `platform` varchar(191) DEFAULT NULL,
  `ipAddress` varchar(191) DEFAULT NULL,
  `trusted` tinyint(1) NOT NULL DEFAULT 0,
  `lastLoginAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_devices_userId_deviceId_key` (`userId`,`deviceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_devices`
--

LOCK TABLES `user_devices` WRITE;
/*!40000 ALTER TABLE `user_devices` DISABLE KEYS */;
INSERT INTO `user_devices` VALUES
('cmi7b69wh0002zrs72upqhn99','cmi7b69q20000zrs7cvqaxass','mozilla/5.0 (iphone; cpu iphone os 18_5 like mac os x) applewebkit/605.1.15 (khtml, like gecko) version/18.5 mobile/15e148 safari/604.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','web','::ffff:127.0.0.1',0,'2025-11-21 10:47:17.318','2025-11-20 10:48:43.938'),
('cmi7em1vz0001zr40wb2kqh5w','cmi7b69q20000zrs7cvqaxass','mozilla/5.0 (x11; linux x86_64) applewebkit/537.36 (khtml, like gecko) chrome/142.0.0.0 safari/537.36','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36','web','::ffff:127.0.0.1',0,'2025-11-20 12:24:58.895','2025-11-20 12:24:58.895'),
('cmi7jmbet0002zrz771nry2tj','cmi7jmb9o0000zrz7st9k10iw','mozilla/5.0 (iphone; cpu iphone os 18_5 like mac os x) applewebkit/605.1.15 (khtml, like gecko) version/18.5 mobile/15e148 safari/604.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','web','::ffff:127.0.0.1',0,'2025-11-20 14:45:09.317','2025-11-20 14:45:09.317'),
('cmi7w9ap70001zrmqcqq65bb6','cmi7b69q20000zrs7cvqaxass','mozilla/5.0 (linux; android 10; k) applewebkit/537.36 (khtml, like gecko) chrome/142.0.0.0 mobile safari/537.36','Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36','web','::ffff:127.0.0.1',0,'2025-11-21 12:50:40.847','2025-11-20 20:38:56.875'),
('cmi7wk3oz0008zrmqvh5fb42s','cmi7wk3g10006zrmqkcx8fzac','mozilla/5.0 (iphone; cpu iphone os 18_6_2 like mac os x) applewebkit/605.1.15 (khtml, like gecko) version/18.6 mobile/15e148 safari/604.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1','web','::ffff:127.0.0.1',0,'2025-11-20 20:47:21.011','2025-11-20 20:47:21.011'),
('cmi853w720002zrm1e1un5gvr','cmi853w170000zrm1zzvlkdn3','mozilla/5.0 (iphone; cpu iphone os 18_5 like mac os x) applewebkit/605.1.15 (khtml, like gecko) version/18.5 mobile/15e148 safari/604.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','web','::ffff:127.0.0.1',0,'2025-11-21 00:46:41.342','2025-11-21 00:46:41.342');
/*!40000 ALTER TABLE `user_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_favorite_categories`
--

DROP TABLE IF EXISTS `user_favorite_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_favorite_categories` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `categoryId` varchar(191) NOT NULL,
  `priority` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_favorite_categories_userId_categoryId_key` (`userId`,`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_favorite_categories`
--

LOCK TABLES `user_favorite_categories` WRITE;
/*!40000 ALTER TABLE `user_favorite_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_favorite_categories` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-21 12:09:09
