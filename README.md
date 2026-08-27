# NEET Notes Marketplace - Full-Stack Application

A production-ready full-stack educational marketplace built for NEET aspirants to preview, purchase, and download high-yield study materials, handwritten formula sheets, NCERT extract maps, and 15-year past question banks.

---

## Technology Stack

* **Frontend**: React 18, Tailwind CSS, Lucide Icons, Canvas PDF Viewer
* **Backend**: Node.js + Express.js (REST API Architecture)
* **Database**: MySQL running on your own/local server via `mysql2/promise` with structured relational schema (`backend/db/schema.sql`) and instant fallback for local development.
* **Authentication**: Express JWT (`jsonwebtoken`) + `bcrypt` password hashing
* **Payment Gateway**: Razorpay Integration (Order initiation + HMAC-SHA256 signature verification)
* **File Handling**: Multer for PDF file uploads, previews, and thumbnails
* **Security**: Helmet, CORS, Rate Limiting, Input Validation, 256-bit download verification

---

## 1. Quick Start Guide (VS Code)

### Step 1: Clone and Install Dependencies
Open the project folder in VS Code and in your terminal run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Inside `.env`, configure your own MySQL connection details and Razorpay credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=neet_notes_db
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key
RAZORPAY_KEY_ID=rzp_test_YourKey
RAZORPAY_KEY_SECRET=YourKeySecret
```

### Step 3: MySQL Database Setup
Open MySQL on your server and execute `backend/db/schema.sql`:
```bash
mysql -u root -p < backend/db/schema.sql
```
*(Note: If MySQL is not running yet, the backend automatically initializes with a high-fidelity in-memory relational engine so you can immediately explore and test all features without interruption!)*

### Step 4: Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 2. Default Test Accounts

### Student Account:
* **Email**: `aarav.sharma@example.com`
* **Password**: `Student@12345`

### Faculty & Admin Account:
* **Email**: `admin@neetnotes.com`
* **Password**: `Admin@12345`
* *Admin Portal can be accessed discreetly via the footer link **"Faculty & Admin Portal"** or by choosing "Faculty Admin" in the Sign In dialog.*

---

## 3. Core Features & Capabilities

1. **High-Yield Catalog**: Filter by Subject (Physics, Chemistry, Biology), Search by Chapter, Sort by Popularity / Price / Ratings.
2. **In-Browser Free Preview**: Preview the first 3-5 pages of any note module before purchasing.
3. **Cart & Coupons**: Apply promo codes like `NEET20` for 20% discount or `DOCTOR50`.
4. **Verified Checkout**: Integrated with Razorpay standard modal + simulated verified test gateway.
5. **Student Library**: Instant access to purchased notes with 1-click PDF download.
6. **Faculty Admin Control**:
   - Analytics dashboard with real-time revenue and download statistics
   - CRUD management for notes (Multer file upload for PDF, previews, thumbnails)
   - Order management and status updates
   - Student directory with activation toggles
   - Review moderation desk (Approve / Reject)
   - Coupon creator with discount rules
   - Student inquiries desk and refund request resolution.
