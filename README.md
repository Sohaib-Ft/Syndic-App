# 🏢 SyndicPro — Application de Gestion de Copropriété

Application web complète pour la gestion de syndic d'appartements, avec deux rôles : **Syndic** (administrateur) et **Résident**.

## 📋 Stack technique

- **Frontend** : React 19, Tailwind CSS v4, React Router, Recharts, Lucide React
- **Backend** : Node.js, Express 5, Prisma ORM, PostgreSQL
- **Auth** : JWT + Bcrypt

## 🚀 Installation

### Prérequis
- Node.js 18+
- PostgreSQL installé et en cours d'exécution

### 1. Backend

```bash
cd backend
npm install
```

Configurez `.env` avec votre URL PostgreSQL :
```
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/syndic_db?schema=public"
```

Créez la base de données et appliquez les migrations :
```bash
npx prisma migrate dev --name init
```

Remplissez la base avec des données de test :
```bash
npm run db:seed
```

Lancez le serveur :
```bash
npm run dev
```

### 2. Frontend

```bash
# À la racine du projet
npm install
npm run dev
```

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Syndic | syndic@immeuble.ma | admin123 |
| Résident | youssef@mail.com | resident123 |

## 📁 Structure du projet

```
/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── server.js
│       ├── middleware/auth.js
│       ├── routes/
│       └── controllers/
├── src/
│   ├── components/Layout.jsx
│   ├── contexts/AuthContext.jsx
│   ├── services/api.js
│   └── pages/
│       ├── Login.jsx
│       ├── syndic/
│       └── resident/
└── package.json
```

## ✨ Fonctionnalités

### Syndic
- Dashboard avec KPIs et graphiques
- Gestion des appartements (CRUD)
- Gestion des résidents (CRUD + fiche détaillée)
- Gestion des paiements (filtres, validation, génération mensuelle)
- Gestion des annonces (CRUD avec catégories)
- Gestion des charges/dépenses (CRUD + pie chart)

### Résident
- Dashboard personnel
- Statut du paiement du mois
- Historique des paiements
- Consultation des annonces
