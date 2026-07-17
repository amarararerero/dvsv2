# [Project Name]

[![Node Version](https://img.shields.io/badge/Node.js-%3E%3D20.19.0-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![Vue Version](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat&logo=vue.js&logoColor=white)](https://vuejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-database-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Express](https://img.shields.io/badge/Express-backend-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

The DiSK Voting System (DVS) is a secure and resilient electronic voting application designed for student elections. The system ensures vote integrity through cryptographic measures and provides detailed administrative controls.

## Summary
This application provides a secure portal for student voting and a comprehensive management panel for election administrators. It is built to coordinate digital elections while ensuring that voter records and candidates are handled efficiently.

## Core Features / Modules

- **Student Voting Portal**: Features secure login using a Student ID, a digital pledge agreement, and a candidate selection interface with strict double-vote validation logic.
- **Administrative Control Panel**: Provides dashboard visualization of turnout metrics (such as aggregated participation for semester cohorts), live candidate vote counts, and voter records.
- **Management Tools**: Allows database operations such as importing student/candidate spreadsheets (using SheetJS) and managing active election properties (such as maintenance mode toggle and start/end dates).
- **Vote Recovery System**: Implements temporary pending vote collections with MongoDB TTL expiration to recover transactions in the event of database interruptions.
- **Payload Security**: Encrypts request and response data between the client and server using AES cryptography to prevent unauthorized data manipulation.

## Tech Stack

- **Frontend**: Vue 3, Vue Router, Tailwind CSS, Chart.js, SheetJS, and jsPDF.
- **Backend**: Node.js and Express.js.
- **Database**: MongoDB with Mongoose object modeling.
- **Security**: JSON Web Tokens (JWT) for authentication and CryptoJS for end-to-end payload encryption.

## Directory Structure

```
dsv2/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   └── AnalyticsChart.vue
│   │   │   ├── layout/
│   │   │   │   ├── Footer.vue
│   │   │   │   └── NavBar.vue
│   │   │   ├── popups/
│   │   │   │   ├── Closed.vue
│   │   │   │   ├── Maintenance.vue
│   │   │   │   ├── NotStarted.vue
│   │   │   │   └── Open.vue
│   │   │   ├── shared/
│   │   │   │   ├── LoginModal.vue
│   │   │   │   └── PledgeModal.vue
│   │   │   └── voting/
│   │   │       └── CandidateCard.vue
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── stores/
│   │   │   └── auth.js
│   │   ├── views/
│   │   │   ├── admin/
│   │   │   │   └── AdminPanel.vue
│   │   │   ├── public/
│   │   │   │   ├── AboutView.vue
│   │   │   │   ├── HomeView.vue
│   │   │   │   ├── NotFoundView.vue
│   │   │   │   ├── RulesView.vue
│   │   │   │   └── WarningView.vue
│   │   │   └── student/
│   │   │       ├── DashboardView.vue
│   │   │       └── SuccessView.vue
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env
├── index.js
├── models.js
├── package.json
├── vercel.json
└── .env
```

## Local Setup

### Environment Requirements

- **Node.js**: Versions matching `^20.19.0` or `>=22.12.0`
- **MongoDB**: An active local or cloud-hosted instance

### Configuration Files

Before running the application, configure your credentials by placing `.env` files in the following paths.

1. **Root Directory `.env` (`dsv2/.env`)**:
   ```env
   MONGO_URI=mongodb://localhost:27017/diskTest
   PORT=5000
   JWT_SECRET=your_jwt_secret_key
   ENCRYPTION_KEY=your_aes_encryption_key
   ```

2. **Client Directory `.env` (`dsv2/client/.env`)**:
   ```env
   VITE_ENCRYPTION_KEY=your_aes_encryption_key
   ```
   *Note: The AES encryption key must match in both files for the encryption/decryption middleware to function.*

### Execution Instructions

1. **Install Dependencies**:
   Install backend and frontend packages from the repository root:
   ```bash
   npm run install-all
   ```

2. **Run in Development Mode**:
   Start both Express API and Vite servers concurrently:
   ```bash
   npm run dev
   ```

The backend server is accessible at `http://localhost:5000` while the frontend runs at `http://localhost:5173`.

## Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/notyourstepdad">
        <img src="https://github.com/notyourstepdad.png" width="80px;" alt="notyourstepdad" style="border-radius:50%;"/><br />
        <sub><b>notyourstepdad</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/kylokai">
        <img src="https://github.com/kylokai.png" width="80px;" alt="kylokai" style="border-radius:50%;"/><br />
        <sub><b>kylokai</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/amarararerero">
        <img src="https://github.com/amarararerero.png" width="80px;" alt="amarararerero" style="border-radius:50%;"/><br />
        <sub><b>amarararerero</b></sub>
      </a>
    </td>
    <td align="center">
      <img src="https://i.pinimg.com/736x/bc/fb/e7/bcfbe72ef4a6fca4d71c29a9be4978e0.jpg" width="80px;" alt="Contributor" style="border-radius:50%;"/><br />
      <sub><b>Contributor</b></sub>
    </td>
  </tr>
</table>

